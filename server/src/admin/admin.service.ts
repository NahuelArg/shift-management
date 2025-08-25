import { BadRequestException, ForbiddenException, Injectable, Param } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from './DTO/updateAdmin.dto';
import { Prisma, User, Role, AuthProvider } from '@prisma/client';
import MetricsResponse from './DTO/metricsDto.dto';
import { convertBigIntToString } from 'src/utils/convertBigIntToString';
import { CreateAdminDto } from './DTO/createAdminDto.dto';
import { CreateEmployeeDto } from './DTO/createEmployeeDto.dto';

@Injectable()

export class AdminService {

    constructor(private prisma: PrismaService,) { }
    async createAdmin(dto: CreateAdminDto) {
        const { email, password, name, authProvider, role } = dto;
        if (role !== 'ADMIN') {
            throw new Error('Role must be ADMIN');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        // Crear el nuevo usuario
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                authProvider: AuthProvider.LOCAL,
                role,
            },
        });


    }
    async updateAdmin(id: string, updateAdminDto: UpdateAdminDto): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: updateAdminDto,
        });
    }
    async getDashboard(userId: string) {
        // 1. Obtener los negocios del admin
        const userWithBusinesses = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { businesses: true }
        });
        if (!userWithBusinesses) throw new Error("User not found");

        const businessIds = userWithBusinesses.businesses.map(b => b.id);

        // 2. Contar solo los datos relacionados a esos negocios
        const totalUser = await this.prisma.user.count({
            where: {
                businesses: {
                    some: { id: { in: businessIds } }
                }
            }
        });
        const totalSchedules = await this.prisma.schedule.count({
            where: { businessId: { in: businessIds } }
        });
        const totalBookings = await this.prisma.booking.count({
            where: { businessId: { in: businessIds } }
        });
        const totalServices = await this.prisma.service.count({
            where: { businessId: { in: businessIds } }
        });
        const totalBusiness = businessIds.length;

        return {
            totalUser,
            totalSchedules,
            totalBookings,
            totalServices,
            totalBusiness
        };
    }
    /**
     * Returns aggregated metrics for the admin dashboard.
     * @param businessId Business ID to filter metrics.
     * @param userId ID of the requesting user.
     * @param from Start date (YYYY-MM-DD).
     * @param to End date (YYYY-MM-DD).
     * @param groupBy Grouping period: 'day', 'month', or 'year'.
     */

    async getAllMetrics(
        businessId: string,
        userId: string,
        from: string,
        to: string,
        groupBy: string
    ): Promise<MetricsResponse> {
        if (!businessId || !userId || !from || !to || !groupBy) {
            throw new BadRequestException('Missing required parameters: businessId, userId, from, to, groupBy');
        }
        const startDate = new Date(from);
        const endDate = new Date(to);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD).');
        }
        const validGroupByValues = ['day', 'month', 'year'];
        const groupByLowerCase = groupBy.trim().toLowerCase();
        if (!validGroupByValues.includes(groupByLowerCase)) {
            throw new BadRequestException('Invalid groupBy value. Use "day", "month", or "year".');
        }


        const UserWithBusiness = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                businesses: true
            },

        })
        console.log('User with Business:', UserWithBusiness);
        if (!UserWithBusiness) {
            throw new ForbiddenException('Business not found or you do not have access to it.');
        }
        const isOwner = UserWithBusiness.businesses.some(business => business.id === businessId);
        if (!isOwner) {
            throw new ForbiddenException('You do not have permission to access this business metrics.');
        }

        if (!validGroupByValues.includes(groupBy.trim().toLowerCase())) {

            throw new ForbiddenException('Invalid groupBy value. Use "day", "month", or "year".');
        }

        const userWithBusiness = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                businesses: true
            },
        });

        if (!userWithBusiness) {
            throw new ForbiddenException('Business not found or you do not have access to it.');
        }


        // Set group format for SQL
        let groupFormat: string;
        if (groupByLowerCase === 'day') groupFormat = '%Y-%m-%d';
        else if (groupByLowerCase === 'month') groupFormat = '%Y-%m';
        else groupFormat = '%Y';
        // Bookings by group (raw SQL)
        const bookingsByGroup = await this.prisma.$queryRawUnsafe<any[]>(`
            SELECT
                DATE_FORMAT(date, '${groupFormat}') AS period,
                COUNT(*) AS totalBookings,
                SUM(CASE WHEN status = 'CONFIRMED' THEN finalPrice ELSE 0 END) AS totalRevenue
            FROM Booking
            WHERE businessId = ? AND date BETWEEN ? AND ?
            GROUP BY period
            ORDER BY period ASC;
        `, businessId, from, to);

        //Bookings by service
        const bookingByService = await this.prisma.booking.findMany({
            where: {
                businessId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                service: true
            }
        });

        // Total bookings and revenue
        const totalBookings = await this.prisma.booking.count({
            where: {
                businessId,
                date: { gte: startDate, lte: endDate },
            }
        });
        const totalRevenue = await this.prisma.booking.aggregate({
            _sum: { finalPrice: true },
            where: {
                businessId,
                status: 'CONFIRMED',
                date: { gte: startDate, lte: endDate },
            },
        });
        const result = {
            totalBookings,
            totalRevenue: totalRevenue._sum.finalPrice || 0,
            bookingsByGroup,
            bookingByService: bookingByService.map(booking => ({
                serviceName: booking.service.name,
                date: booking.date.toISOString(),
                finalPrice: booking.finalPrice,
                status: booking.status,
            })),
            groupFormat: groupFormat.replace('%', 'Y').replace('-%m', '-MM').replace('-%d', '-DD'),
        };
        return convertBigIntToString(result);
    }
    async getAdminById(userId: string) {
        if (!userId) throw new Error("User ID is required");

        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                businesses: true
            }
        });
    }
    async getAllEmployees(userId: string, params: { search?: string; page: number; limit: number, businessId?: string }) {
        const { search, businessId } = params;
        let businessIds: string[] = [];
        if (businessId) {
            const business = await this.prisma.business.findUnique({
                where: { id: businessId, ownerId: userId }
            });
            if (!business) throw new ForbiddenException("Unauthorized");
            businessIds = [businessId];
        } else {
            const businesses = await this.prisma.business.findMany({
                where: { ownerId: userId },
                select: { id: true }
            });
            businessIds = businesses.map(b => b.id);
        }

        const where: any = {
            role: 'EMPLOYEE',
            businessId: { in: businessIds },
            ...(search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { email: { contains: search } },
                    ],
                }
                : {}),
        };
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;
        const [employees, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    business: { select: { name: true } }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        // Mapear el nombre del negocio para el frontend
        const mapped = employees.map(e => ({
            ...e,
            businessName: e.business?.name || '-'
        }));
        return { employees: mapped, total };
    }
    async deleteEmployee(id: string) {
        if (!id) throw new Error("Employee ID is required");

        return this.prisma.user.delete({
            where: { id, role: 'EMPLOYEE' }
        });
    }
    async createEmployee(dto: CreateEmployeeDto, adminId: string) {
        const { name, email, password, businessId, role, authProvider } = dto;
        // Validar que el negocio pertenece al admin
        const business = await this.prisma.business.findFirst({
            where: { id: businessId, ownerId: adminId }
        });
        if (!business) throw new Error("No puedes crear empleados en este negocio");

        // Validar que el email no exista
        const existingUser = await this.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error("El email ya está registrado");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: Role.EMPLOYEE,
                authProvider: AuthProvider.LOCAL,
                businessId: businessId
            }
        });
    }
}
