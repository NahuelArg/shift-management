import { ApiProperty } from '@nestjs/swagger';

class BookingByGroupDto {
  @ApiProperty({
    example: '2025-08-01',
    description: 'Grouped period (day, month, or year) in string format.',
  })
  period: string;

  @ApiProperty({
    example: 10,
    description: 'Total number of bookings in this period.',
  })
  totalBookings: number;

  @ApiProperty({
    example: 25000,
    description: 'Total revenue for this period.',
  })
  totalRevenue: number;
}

class BookingByServiceDto {
  @ApiProperty({
    example: 'Haircut',
    description: 'Name of the booked service.',
  })
  serviceName: string;

  @ApiProperty({ example: '2025-08-01', description: 'Date of the booking.' })
  date: string;

  @ApiProperty({ example: 2500, description: 'Final price for the booking.' })
  finalPrice: number;

  @ApiProperty({ example: 'CONFIRMED', description: 'Status of the booking.' })
  status: string;
}

export default class MetricsResponse {
  @ApiProperty({
    example: 42,
    description: 'Total number of bookings in the selected period.',
  })
  totalBookings: number;

  @ApiProperty({
    example: 120000,
    description:
      'Total revenue from confirmed bookings in the selected period.',
  })
  totalRevenue: number;

  @ApiProperty({
    type: [BookingByGroupDto],
    description:
      'List of bookings and revenue grouped by the selected period (day, month, or year).',
  })
  bookingsByGroup: BookingByGroupDto[];

  @ApiProperty({
    type: [BookingByServiceDto],
    description: 'Detailed list of bookings by service.',
  })
  bookingByService: BookingByServiceDto[];

  @ApiProperty({
    example: 'YYYY-MM-DD',
    description: 'Date format used for grouping (day, month, or year).',
  })
  groupFormat: string;
}
