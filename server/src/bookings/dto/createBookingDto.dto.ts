import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Service ID', example: 'abc-123-def-456' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Business ID', example: 'xyz-789-ghi-012' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiPropertyOptional({
    description:
      'Employee ID (optional - if not provided, system assigns available employee)',
    example: 'emp-111-222-333',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description:
      'Client the booking is for. Only used when ADMIN/EMPLOYEE books on behalf of a client; ignored for CLIENT (always the authenticated user).',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Booking start (ISO 8601)',
    example: '2026-01-21T14:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description:
      'Deprecated: ignored. The business timezone is always used to validate opening hours.',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description:
      'Deprecated: ignored. The price is always taken from the service on the server.',
  })
  @IsOptional()
  @IsNumber()
  finalPrice?: number;
}
