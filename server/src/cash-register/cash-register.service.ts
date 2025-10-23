import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';

@Injectable()
export class CashRegisterService {
    constructor(private prisma: PrismaService) { }

    /**
     * Crear una nueva caja registradora
     */
    async create(dto: CreateCashRegisterDto, userId: string) {
        // Verificar que el usuario sea owner del negocio
        const business = await this.prisma.business.findFirst({
            where: { id: dto.businessId, ownerId: userId },
        });

        if (!business) {
            throw new ForbiddenException('No tienes permiso para crear cajas en este negocio');
        }

        return this.prisma.cashRegister.create({
            data: {
                name: dto.name,
                businessId: dto.businessId,
                status: 'CLOSED',
                currentBalance: 0,
            },
        });
    }

    /**
     * Abrir caja
     */
    async open(cashRegisterId: string, dto: OpenCashRegisterDto, userId: string) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id: cashRegisterId },
            include: { business: true },
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        if (cashRegister.status === 'OPEN') {
            throw new BadRequestException('La caja ya está abierta');
        }

        // Verificar permisos (owner o employee del negocio)
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        const hasPermission =
            cashRegister.business.ownerId === userId ||
            (user?.businessId === cashRegister.businessId && user?.role === 'EMPLOYEE');

        if (!hasPermission) {
            throw new ForbiddenException('No tienes permiso para abrir esta caja');
        }

        // Abrir caja y crear movimiento de apertura
        const [updatedCashRegister] = await this.prisma.$transaction([
            this.prisma.cashRegister.update({
                where: { id: cashRegisterId },
                data: {
                    status: 'OPEN',
                    openedAt: new Date(),
                    openedById: userId,
                    currentBalance: dto.openingBalance,
                },
            }),
            this.prisma.cashMovement.create({
                data: {
                    cashRegisterId,
                    type: 'OPENING',
                    amount: dto.openingBalance,
                    paymentMethod: 'CASH',
                    description: 'Apertura de caja',
                    createdById: userId,
                },
            }),
        ]);

        return updatedCashRegister;
    }

    /**
     * Registrar movimiento
     */
    async createMovement(
        cashRegisterId: string,
        dto: CreateCashMovementDto,
        userId: string,
    ) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id: cashRegisterId },
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        if (cashRegister.status !== 'OPEN') {
            throw new BadRequestException('La caja debe estar abierta para registrar movimientos');
        }

        // Si es una venta con bookingId, marcar el booking como pagado
        if (dto.bookingId && dto.type === 'SALE') {
            await this.prisma.booking.update({
                where: { id: dto.bookingId },
                data: {
                    paymentStatus: 'PAID',
                    paymentMethod: dto.paymentMethod,
                },
            });
        }

        // Calcular nuevo balance
        let balanceChange = 0;
        if (dto.type === 'SALE' || dto.type === 'DEPOSIT') {
            balanceChange = dto.amount;
        } else if (dto.type === 'EXPENSE' || dto.type === 'WITHDRAWAL') {
            balanceChange = -dto.amount;
        }

        // Solo sumar efectivo al balance
        const cashChange = dto.paymentMethod === 'CASH' ? balanceChange : 0;

        // Crear movimiento y actualizar balance
        const [movement] = await this.prisma.$transaction([
            this.prisma.cashMovement.create({
                data: {
                    cashRegisterId,
                    type: dto.type,
                    amount: dto.amount,
                    paymentMethod: dto.paymentMethod,
                    bookingId: dto.bookingId,
                    description: dto.description,
                    createdById: userId,
                },
                include: {
                    booking: {
                        include: {
                            service: true,
                            user: true,
                        },
                    },
                },
            }),
            this.prisma.cashRegister.update({
                where: { id: cashRegisterId },
                data: {
                    currentBalance: {
                        increment: cashChange,
                    },
                },
            }),
        ]);

        return movement;
    }

    /**
     * Cerrar caja y hacer arqueo
     */
    async close(cashRegisterId: string, dto: CloseCashRegisterDto, userId: string) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id: cashRegisterId },
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        if (cashRegister.status !== 'OPEN') {
            throw new BadRequestException('La caja ya está cerrada');
        }

        // Calcular totales
        const movements = await this.prisma.cashMovement.findMany({
            where: {
                cashRegisterId,
                createdAt: {
                    gte: cashRegister.openedAt!,
                },
            },
        });

        const openingMovement = movements.find((m) => m.type === 'OPENING');
        const openingBalance = openingMovement?.amount || 0;

        const totalSales = movements
            .filter((m) => m.type === 'SALE')
            .reduce((sum, m) => sum + m.amount, 0);

        const totalExpenses = movements
            .filter((m) => m.type === 'EXPENSE' || m.type === 'WITHDRAWAL')
            .reduce((sum, m) => sum + m.amount, 0);

        const totalCash = movements
            .filter((m) => m.paymentMethod === 'CASH' && m.type !== 'OPENING')
            .reduce((sum, m) => {
                if (m.type === 'SALE' || m.type === 'DEPOSIT') return sum + m.amount;
                if (m.type === 'EXPENSE' || m.type === 'WITHDRAWAL') return sum - m.amount;
                return sum;
            }, 0);

        const totalCard = movements
            .filter((m) => m.paymentMethod === 'CARD')
            .reduce((sum, m) => sum + m.amount, 0);

        const totalTransfer = movements
            .filter((m) => m.paymentMethod === 'TRANSFER')
            .reduce((sum, m) => sum + m.amount, 0);

        const expectedBalance = openingBalance + totalCash;
        const difference = dto.actualBalance - expectedBalance;

        // Crear cierre y cerrar caja
        const [closing] = await this.prisma.$transaction([
            this.prisma.cashClosing.create({
                data: {
                    cashRegisterId,
                    openingBalance,
                    expectedBalance,
                    actualBalance: dto.actualBalance,
                    difference,
                    totalSales,
                    totalExpenses,
                    totalCash,
                    totalCard,
                    totalTransfer,
                    notes: dto.notes,
                    closedById: userId,
                },
            }),
            this.prisma.cashRegister.update({
                where: { id: cashRegisterId },
                data: {
                    status: 'CLOSED',
                    closedAt: new Date(),
                    closedById: userId,
                    currentBalance: 0,
                },
            }),
            this.prisma.cashMovement.create({
                data: {
                    cashRegisterId,
                    type: 'CLOSING',
                    amount: dto.actualBalance,
                    paymentMethod: 'CASH',
                    description: `Cierre de caja - Diferencia: ${difference}`,
                    createdById: userId,
                },
            }),
        ]);

        return closing;
    }

    /**
     * Obtener caja por ID
     */
    async findOne(id: string) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id },
            include: {
                business: true,
                OpenedBy: { select: { id: true, name: true, email: true } },
                ClosedBy: { select: { id: true, name: true, email: true } },
            },
        });

        if (!cashRegister) {
            throw new NotFoundException('Caja no encontrada');
        }

        return cashRegister;
    }

    /**
     * Listar cajas de un negocio
     */
    async findByBusiness(businessId: string, userId: string) {
        // Verificar permisos
        const business = await this.prisma.business.findFirst({
            where: {
                id: businessId,
                OR: [
                    { ownerId: userId },
                    { employees: { some: { id: userId } } },
                ],
            },
        });

        if (!business) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }

        return this.prisma.cashRegister.findMany({
            where: { businessId },
            include: {
                OpenedBy: { select: { id: true, name: true } },
                ClosedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Obtener movimientos de una caja
     */
    async getMovements(cashRegisterId: string, userId: string) {
        const cashRegister = await this.findOne(cashRegisterId);

        // Verificar permisos
        const business = await this.prisma.business.findFirst({
            where: {
                id: cashRegister.businessId,
                OR: [
                    { ownerId: userId },
                    { employees: { some: { id: userId } } },
                ],
            },
        });

        if (!business) {
            throw new ForbiddenException('No tienes acceso a esta caja');
        }

        return this.prisma.cashMovement.findMany({
            where: { cashRegisterId },
            include: {
                booking: {
                    include: {
                        service: true,
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
                CreatedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Obtener cierres de caja
     */
    async getClosings(cashRegisterId: string, userId: string) {
        const cashRegister = await this.findOne(cashRegisterId);

        // Verificar permisos
        const business = await this.prisma.business.findFirst({
            where: {
                id: cashRegister.businessId,
                OR: [
                    { ownerId: userId },
                    { employees: { some: { id: userId } } },
                ],
            },
        });

        if (!business) {
            throw new ForbiddenException('No tienes acceso a esta caja');
        }

        return this.prisma.cashClosing.findMany({
            where: { cashRegisterId },
            include: {
            ClosedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { closedAt: 'desc' },
    });
}

}