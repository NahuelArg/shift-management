import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Booking, Prisma } from '@prisma/client';
import { BookingDto } from './dto/BookingsDto.dto';
import { UpdateBookingDto } from './dto/updateBookingDto.dto';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { format } from 'date-fns';
import { toMinutes } from '../utils/toMinutes';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.prisma.booking.findMany();
  }
  /**
   * Crea una reserva validando todo en el servidor. Nada de lo que define el
   * precio, el horario o la pertenencia se toma del cliente:
   * - el servicio debe pertenecer al negocio,
   * - el precio sale del servicio (`finalPrice` del body se ignora),
   * - el horario se valida con la zona horaria del negocio,
   * - no se aceptan fechas pasadas,
   * - ADMIN solo reserva en sus negocios; EMPLOYEE solo en el suyo;
   *   CLIENT siempre reserva para sí mismo.
   */
  async create(
    data: CreateBookingDto,
    actor: { userId: string; role: string },
  ): Promise<Booking> {
    const { serviceId, businessId, employeeId, date: dateInput } = data;

    if (!businessId) throw new BadRequestException('Business ID is required');
    if (!serviceId) throw new BadRequestException('Service ID is required');
    if (!dateInput) throw new BadRequestException('Booking date is required');

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, timezone: true },
    });
    if (!business) throw new BadRequestException('Business not found');

    // ── Autorización por rol ──────────────────────────────────────────────
    let userId: string | null;
    if (actor.role === 'CLIENT') {
      userId = actor.userId;
    } else {
      if (actor.role === 'ADMIN' && business.ownerId !== actor.userId) {
        throw new ForbiddenException('You can only book in your own businesses');
      }
      if (actor.role === 'EMPLOYEE') {
        const me = await this.prisma.user.findUnique({
          where: { id: actor.userId },
          select: { businessId: true },
        });
        if (me?.businessId !== businessId) {
          throw new ForbiddenException('You can only book in your own business');
        }
      }
      userId = data.userId ?? null; // null = walk-in
      if (userId) {
        const client = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        if (!client || client.role !== 'CLIENT') {
          throw new BadRequestException('Client not found');
        }
      }
    }

    // ── Servicio ──────────────────────────────────────────────────────────
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new BadRequestException('Service not found');
    if (service.businessId !== businessId) {
      throw new BadRequestException('Service does not belong to this business');
    }
    if (!service.durationMin || service.durationMin <= 0) {
      throw new BadRequestException(
        'Service duration must be a positive number and greater than zero',
      );
    }
    const durationMin = service.durationMin;

    // ── Fecha ─────────────────────────────────────────────────────────────
    const dateUtc = new Date(dateInput);
    if (isNaN(dateUtc.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (dateUtc.getTime() < Date.now()) {
      throw new BadRequestException('Cannot book a date in the past');
    }

    // ── Horario de atención (en la zona horaria del negocio) ──────────────
    const timezone = business.timezone;
    const localDate = new Date(
      dateUtc.toLocaleString('en-US', { timeZone: timezone }),
    );
    const dayOfWeek = localDate.getDay();
    const timeStr = format(localDate, 'HH:mm');

    const schedule = await this.prisma.schedule.findFirst({
      where: {
        businessId,
        dayOfWeek,
        from: { lte: timeStr },
        to: { gte: timeStr },
      },
    });
    if (!schedule) {
      throw new BadRequestException(
        `El negocio no atiende el día ${dayOfWeek} a las ${timeStr} (hora local).`,
      );
    }

    const endTime = new Date(dateUtc.getTime() + durationMin * 60000);
    const localEndTime = new Date(
      endTime.toLocaleString('en-US', { timeZone: timezone }),
    );
    const endTimeStr = format(localEndTime, 'HH:mm');
    // Si termina otro día (pasa medianoche) también queda fuera del horario
    const endsNextDay = localEndTime.getDate() !== localDate.getDate();
    if (endsNextDay || toMinutes(endTimeStr) > toMinutes(schedule.to)) {
      throw new BadRequestException(
        `Service would end at ${endTimeStr}, after business closing time (${schedule.to}). Please choose an earlier time.`,
      );
    }

    // ── Empleado, conflictos y alta: dentro de una transacción ────────────
    // pg_advisory_xact_lock serializa la creación de reservas del mismo negocio:
    // dos pedidos simultáneos ya no pueden ver el mismo hueco libre y reservarlo
    // los dos (race condition). El lock se libera solo al terminar la transacción.
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${businessId}))`;

      // ── Empleado ──────────────────────────────────────────────────────────
      let finalEmployeeId: string | null = employeeId || null;
      if (!finalEmployeeId) {
        const available = await this.findAvailableEmployee(businessId, dateUtc, endTime, tx);
        if (!available || available.length === 0) {
          throw new BadRequestException(
            'No available employees for the selected time slot',
          );
        }
        finalEmployeeId = available[0].id;
      } else {
        const employee = await tx.user.findFirst({
          where: { id: finalEmployeeId, businessId, role: 'EMPLOYEE' },
        });
        if (!employee) {
          throw new BadRequestException('Employee not found in this business');
        }
      }

      const conflicting = await tx.booking.findFirst({
        where: {
          employeeId: finalEmployeeId,
          status: { not: 'CANCELLED' },
          date: { lt: endTime },
          endTime: { gt: dateUtc },
        },
      });
      if (conflicting) {
        throw new BadRequestException(
          'The selected employee is not available at the chosen time',
        );
      }

      return tx.booking.create({
        data: {
          userId,
          serviceId,
          businessId,
          employeeId: finalEmployeeId,
          date: dateUtc,
          endTime,
          timezone,
          finalPrice: service.price,
          status: BookingStatus.PENDING,
        },
        include: {
          employee: { select: { id: true, name: true, email: true } },
          service: true,
          business: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  /**
   * Borra una reserva.
   * - ADMIN: reservas de sus negocios.
   * - CLIENT: sus propias reservas, salvo las COMPLETED (son historial de cobro).
   * Antes se buscaba por { id, userId } (nadie podía borrar reservas ajenas,
   * tampoco el admin) y al ADMIN se le comparaba su businessId, que es null.
   */
  async delete(
    id: string,
    user: { userId: string; role: string },
  ): Promise<BookingDto> {
    if (!id || !user) throw new BadRequestException('Bad Request');
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const allowed =
      (user.role === 'ADMIN' && booking.business.ownerId === user.userId) ||
      (user.role === 'CLIENT' && booking.userId === user.userId);
    if (!allowed) throw new ForbiddenException('Forbidden');

    if (user.role === 'CLIENT' && booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be deleted');
    }

    const deleted = await this.prisma.booking.delete({ where: { id } });
    return {
      id: deleted.id,
      userId: deleted.userId,
      serviceId: deleted.serviceId,
      businessId: deleted.businessId,
      date: deleted.date,
      status: deleted.status,
      createdAt: deleted.createdAt,
    };
  }
  async update(
    id: string,
    dto: UpdateBookingDto,
    adminId: string,
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        businessId: true,
        date: true,
        endTime: true,
        business: { select: { ownerId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.business.ownerId !== adminId) {
      throw new ForbiddenException('Not authorized to update this booking');
    }

    if (dto.employeeId) {
      const employee = await this.prisma.user.findFirst({
        where: { id: dto.employeeId, businessId: booking.businessId, role: 'EMPLOYEE' },
      });
      if (!employee) {
        throw new BadRequestException('Employee not found in this business');
      }
      const conflicting = await this.prisma.booking.findFirst({
        where: {
          id: { not: id },
          employeeId: dto.employeeId,
          status: { not: 'CANCELLED' },
          date: { lt: booking.endTime },
          endTime: { gt: booking.date },
        },
      });
      if (conflicting) {
        throw new BadRequestException(
          'The selected employee is not available at that time',
        );
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.employeeId !== undefined && { employeeId: dto.employeeId }),
        ...(dto.finalPrice !== undefined && { finalPrice: dto.finalPrice }),
      },
    });
  }
  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
  async getBookingByQuery(filters: {
    ownerId: string;
    status?: BookingStatus;
    date?: string;
    userId?: string;
    businessId?: string;
    limit?: number;
  }) {
    // Un admin solo ve reservas de los negocios que le pertenecen
    const where: Prisma.BookingWhereInput = {
      business: { ownerId: filters.ownerId },
    };
    if (filters.businessId) where.businessId = filters.businessId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (filters.userId) where.userId = filters.userId;

    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true } },
        business: { select: { id: true, name: true } },
      },
      // Con limit devolvemos las más recientes (ej. "últimas 5" del dashboard)
      orderBy: { date: filters.limit ? 'desc' : 'asc' },
      ...(filters.limit ? { take: Math.min(filters.limit, 100) } : {}),
    });
  }
  /**
   * Cambia el estado de una reserva aplicando las reglas de cada rol:
   * - ADMIN:    solo reservas de negocios que le pertenecen.
   * - EMPLOYEE: solo reservas asignadas a él.
   * - CLIENT:   solo sus propias reservas, y únicamente para cancelarlas
   *             mientras estén PENDING o CONFIRMED.
   */
  async changeStatus(
    actor: { userId: string; role: string },
    id: string,
    status: BookingStatus,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        userId: true,
        employeeId: true,
        status: true,
        business: { select: { ownerId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    switch (actor.role) {
      case 'ADMIN':
        if (booking.business.ownerId !== actor.userId) {
          throw new ForbiddenException('Not authorized to update this booking');
        }
        break;
      case 'EMPLOYEE':
        if (booking.employeeId !== actor.userId) {
          throw new ForbiddenException('Not authorized to update this booking');
        }
        break;
      case 'CLIENT': {
        if (booking.userId !== actor.userId) {
          throw new ForbiddenException('Not authorized to update this booking');
        }
        if (status !== BookingStatus.CANCELLED) {
          throw new ForbiddenException('Clients can only cancel their bookings');
        }
        const cancellable: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
        if (!cancellable.includes(booking.status)) {
          throw new BadRequestException('This booking can no longer be cancelled');
        }
        break;
      }
      default:
        throw new ForbiddenException('Not authorized to update this booking');
    }

    return this.updateStatus(id, status);
  }

  async updateStatus(id: string, status: BookingStatus) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
  /**
   * Encuentra un empleado disponible para el negocio y horario dado
   * @param businessId 
   * @param startTime 
   * @param endTime 
   * @returns 
   */
  async findAvailableEmployee(
    businessId: string,
    startTime: Date,
    endTime: Date,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<{ id: string; name: string }[]> {
    const employees = await db.user.findMany({
      where: {
        businessId,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (employees.length === 0) {
      return []; // No hay empleados en el negocio
    }
    const employeeIds = employees.map(e => e.id)
  
    const conflictingBookings = await db.booking.findMany({
        where: {
          employeeId: {in:employeeIds},
          status: { not: 'CANCELLED' },
          date: { lt: endTime },
          endTime: { gt: startTime },
        },
      })
      const busyIds = new Set(conflictingBookings.map(b=>b.employeeId))
      return employees.filter(e=> !busyIds.has(e.id))
  }
  /**
   * Get all bookings assigned to a specific employee
   */
  async getBookingsByEmployee(employeeId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        employeeId,
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
  /**
   * Get all bookings for a specific user (client)
   */
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        service: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
