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
  ParseIntPipe,
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
import { UpdateBookingStatusDto } from './dto/updateBookingStatusDto.dto';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateBookingDto } from './dto/createBookingDto.dto';
import { RequestWithUser } from '../types/express-request.interface';

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
    @Request() req: RequestWithUser,
    @Query('status') status?: BookingStatus,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
    @Query('businessId') businessId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.bookingsService.getBookingByQuery({
      ownerId: req.user.userId,
      status,
      date,
      userId,
      businessId,
      limit,
    });
  }

  // ✅ GET bookings assigned to employee
  @Get('my-assignments')
  @Roles('EMPLOYEE')
  @ApiOperation({
    summary: 'Get bookings assigned to current employee (EMPLOYEE)',
  })
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
  @ApiOperation({
    summary: 'Create a new booking',
    description:
      'CLIENT books for themselves. ADMIN (own businesses) and EMPLOYEE (own business) can book for a client via userId, or as walk-in. Price and timezone come from the server.',
  })
  @ApiResponse({ status: 201, type: BookingDto })
  async create(
    // Antes el tipo era una intersección (Dto & {...}) y ValidationPipe no validaba nada
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    return this.bookingsService.create(createBookingDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  // ✅ PUT update a booking (just own or any if ADMIN)
  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Reassign employee or adjust price of a booking (ADMIN, own businesses)',
  })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    return this.bookingsService.update(id, updateBookingDto, req.user.userId);
  }

  // ✅ PATCH change the status of a booking
  @Patch(':id/status')
  @Roles('ADMIN', 'EMPLOYEE', 'CLIENT')
  @ApiOperation({
    summary: 'Change the status of a booking',
    description:
      'ADMIN: bookings of own businesses. EMPLOYEE: assigned bookings. CLIENT: can only cancel own PENDING/CONFIRMED bookings.',
  })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @Request() req: RequestWithUser,
  ) {
    // Las reglas de autorización por rol viven en el service (testeables y en un solo lugar)
    return this.bookingsService.changeStatus(
      { userId: req.user.userId, role: req.user.role },
      id,
      body.status,
    );
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
    return this.bookingsService.findAvailableEmployee(
      businessId,
      new Date(date),
      new Date(endTime),
    );
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
    return this.bookingsService.delete(id, req.user);
  }
}
