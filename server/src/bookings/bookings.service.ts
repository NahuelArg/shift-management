import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Booking } from '@prisma/client';
import { BookingDto } from './dto/BookingsDto.dto';
import { UpdateBookingDto } from './dto/updateBookingDto.dto';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { format } from 'date-fns';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private readonly service: PrismaService,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.prisma.booking.findMany();
  }
  async create(data: CreateBookingDto & { userId: string }): Promise<Booking> {
    const {
      serviceId,
      businessId,
      employeeId,
      date: dateInput,
      timezone = 'Europe/Madrid',
      userId,
    } = data;

    if (!businessId) throw new BadRequestException('Business ID is required');
    if (!serviceId) throw new BadRequestException('Service ID is required');
    if (!dateInput) throw new BadRequestException('Booking date is required');

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new BadRequestException('Service not found');

    if (!service.durationMin || service.durationMin <= 0) {
      throw new BadRequestException(
        'Service duration must be a positive number and greater than zero',
      );
    }

    const durationMin = service.durationMin;

    let parsedDate: Date;

    if (typeof dateInput === 'string') {
      parsedDate = new Date(dateInput);
    } else {
      parsedDate = dateInput;
    }

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const dateUtc = parsedDate;

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

    if (endTimeStr > schedule.to) {
      throw new BadRequestException(
        `Service would end at ${endTimeStr}, after business closing time (${schedule.to}). Please choose an earlier time.`,
      );
    }

    let finalEmployeeId: string | null = employeeId || null; // ✅ Correcto
    if (!finalEmployeeId) {
      finalEmployeeId = await this.findAvailableEmployee(
        businessId,
        dateUtc,
        endTime,
      );
      if (!finalEmployeeId) {
        throw new BadRequestException(
          'No available employees for the selected time slot',
        );
      }
    } else {
      const employee = await this.prisma.user.findFirst({
        where: {
          id: finalEmployeeId,
          businessId,
          role: 'EMPLOYEE',
        },
      });
      if (!employee) {
        throw new BadRequestException('Employee not found in this business');
      }
    }

    const conflicting = await this.prisma.booking.findFirst({
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

    // Create the booking
    return this.prisma.booking.create({
      data: {
        userId,
        serviceId,
        businessId,
        employeeId: finalEmployeeId,
        date: dateUtc,
        endTime,
        timezone,
        finalPrice: data.finalPrice,
        status: BookingStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
        business: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  async remove(
    id: string,
    user: { userId: string; role: string },
  ): Promise<BookingDto> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // If the user is CLIENT, can only delete their own booking
    if (user.role === 'CLIENT' && booking.userId !== user.userId) {
      throw new ForbiddenException('Not authorized to delete this booking');
    }

    const deleted = await this.prisma.booking.delete({ where: { id } });
    return deleted;
  }
  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    try {
      return await this.prisma.booking.update({
        where: { id },
        data: updateBookingDto,
      });
    } catch (error: unknown) {
      throw new NotFoundException(error, 'Booking not found');
    }
  }
  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
  async getBookingByQuery(filters: {
    status?: BookingStatus;
    date?: string;
    userId?: string;
  }) {
    const where: {
      status?: BookingStatus;
      date?: { gte: Date; lte: Date };
      userId?: string;
    } = {};
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

    return this.prisma.booking.findMany({ where });
  }
  async updateStatus(id: string, status: BookingStatus) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
  private async findAvailableEmployee(
    businessId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<string | null> {
    const employees = await this.prisma.user.findMany({
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
      return null;
    }
    for (const employee of employees) {
      const hasConflicting = await this.prisma.booking.findFirst({
        where: {
          employeeId: employee.id,
          status: { not: 'CANCELLED' },
          date: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (!hasConflicting) {
        return employee.id;
      }
    }

    return null;
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
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
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
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' },
      ],
    });
  }
}
