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
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { RequestWithUser } from 'src/types/express-request.interface';

@ApiTags('bookings')
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

  // ✅ GET all bookings
  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all bookings (ADMIN)' })
  @ApiResponse({ status: 200, type: [BookingDto] })
  async findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Post()
  @Roles('CLIENT', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: CreateBookingDto })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    // Omitimos el userId del DTO y lo obtenemos del token
    const { userId } = req.user;

    // Crear la reserva con el userId del token
    const bookingData = {
      ...createBookingDto,
      timezone: createBookingDto.timezone || 'UTC',
      userId, // Añadimos el userId del token
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

  // ✅ PUT change the status of a booking
  @Put(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change the status of a booking' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingDto,
  ) {
    if (!body.status) {
      throw new BadRequestException('Booking status is required');
    }
    return this.bookingsService.updateStatus(id, body.status);
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
