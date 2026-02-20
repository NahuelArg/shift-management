import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
  Put,
  Patch,
  Query,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from '@prisma/client';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingDto } from './dto/BookingsDto.dto';
import { UpdateBookingDto } from './dto/updateBookingDto.dto';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { RequestWithUser } from 'src/types/express-request.interface';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ✅ GET filter bookings (status, date, userId)
  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Filter bookings (ADMIN)' })
  @ApiResponse({ status: 200, type: [BookingDto] })
  async getBookingByQuery(
    @Query('status') status?: BookingStatus,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    return this.bookingsService.getBookingByQuery({ status, date, userId });
  }


  // ✅ GET bookings assigned to employee
  @Get('my-assignments')
  @Roles('EMPLOYEE')
  @ApiOperation({ summary: 'Get bookings assigned to current employee (EMPLOYEE)' })
  @ApiResponse({ status: 200, type: [BookingDto] })
  async getMyAssignments(@Request() req: RequestWithUser): Promise<Booking[]> {
    return this.bookingsService.getBookingsByEmployee(req.user.userId);
  }

  // ✅ GET bookings for current user (CLIENT)
  @Get('my-bookings')
  @Roles('CLIENT')
  @ApiOperation({ summary: 'Get bookings for current user (CLIENT)' })
  @ApiResponse({ status: 200, type: [BookingDto] })
  async getMyBookings(@Request() req: RequestWithUser): Promise<Booking[]> {
    return this.bookingsService.getBookingsByUser(req.user.userId);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: CreateBookingDto })
  async create(
    @Body() createBookingDto: CreateBookingDto & { userId?: string },
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
const bookingData = {
      ...createBookingDto,
      timezone: createBookingDto.timezone || 'UTC',
      userId: req.user.role === 'CLIENT' ? req.user.userId : (createBookingDto.userId ?? null),
    };

    return this.bookingsService.create(bookingData);
  }


  // ✅ PUT update a booking (just own or any if ADMIN)
  @Put(':id')
  @Roles('CLIENT', 'ADMIN')
  @ApiOperation({ summary: 'Update a booking' })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    const booking = await this.bookingsService.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
      throw new ForbiddenException('Not authorized to update this booking');
    }
    return this.bookingsService.update(id, updateBookingDto);
  }

  // ✅ PATCH change the status of a booking
  @Patch(':id/status')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Change the status of a booking (ADMIN/EMPLOYEE)' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingDto,
    @Request() req: RequestWithUser,
  ) {
    if (!body.status) {
      throw new BadRequestException('Booking status is required');
    }

    // Si es EMPLOYEE, verificar que la reserva esté asignada a él
    if (req.user.role === 'EMPLOYEE') {
      const booking = await this.bookingsService.findOne(id);
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.employeeId !== req.user.userId) {
        throw new ForbiddenException('Not authorized to update this booking');
      }
    }
    return this.bookingsService.updateStatus(id, body.status);
  }

  @Get('available-employees')
  @Roles('CLIENT', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get available employees for a specific time slot' })
  async getAvailableEmployees(
    @Query('businessId') businessId: string,
    @Query('date') date: string,
    @Query('endTime') endTime: string,
  ) {
      if (!businessId || !date || !endTime) {
        throw new BadRequestException('Missing required query parameters');
      }
    return this.bookingsService.findAvailableEmployee(businessId, new Date(date), new Date(endTime));
  }

  // ✅ DELETE a booking (just own or any if ADMIN)
  @Delete(':id')
  @Roles('CLIENT', 'ADMIN')
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiResponse({ status: 200, type: BookingDto })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<BookingDto> {
    return this.bookingsService.remove(id, req.user);
  }
}

