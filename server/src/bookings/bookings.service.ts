import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Booking } from '@prisma/client';
import { getDay, format } from 'date-fns';
import { BookingDto } from './dto/BookingsDto.dto';
import { UpdateBookingDto } from './dto/updateBookingDto.dto';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { zonedTimeToUtc } from 'date-fns-tz';

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
      date: dateInput,
      timezone = 'UTC',
      userId,
    } = data;

    if (!businessId) throw new BadRequestException('Business ID is required');
    if (!serviceId) throw new BadRequestException('Service ID is required');
    if (!dateInput) throw new BadRequestException('Booking date is required');

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new BadRequestException('Service not found');

    const durationMin = service.durationMin;
    console.log('Service duration:', durationMin);

    // Parse date if it comes as a string
    const parsedDate =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(parsedDate.getTime()))
      throw new BadRequestException('Invalid date');

    // Convert local date to UTC
    const dateUtc = zonedTimeToUtc(parsedDate, timezone);

    // Get info to validate against allowed hours
    const dayOfWeek = getDay(dateUtc); // 0 = Sunday
    const timeStr = format(dateUtc, 'HH:mm');

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
        `El negocio no atiende el día ${dayOfWeek} a las ${timeStr}.`,
      );
    }

    const endTime = new Date(dateUtc.getTime() + durationMin * 60000);
    console.log('End time:', endTime);

    // Check for overlapping bookings
    const conflicting = await this.prisma.booking.findFirst({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        date: { lt: endTime },
        endTime: { gt: dateUtc },
      },
    });

    if (conflicting) {
      throw new BadRequestException(
        'Booking already exists for this time slot',
      );
    }

    // Create the booking
    return this.prisma.booking.create({
      data: {
        ...data,
        date: dateUtc,
        endTime,
        userId,
        status: BookingStatus.PENDING,
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
}
