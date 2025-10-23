import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Service ID',
    example: 'abc-123-def-456',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Business ID',
    example: 'xyz-789-ghi-012',
  })
  @IsString()
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

  @ApiProperty({
    description: 'Booking date and time',
    example: '2025-01-21T14:00:00.000Z',
  })
  @IsNotEmpty()
  date: string | Date;

  @ApiPropertyOptional({
    description: 'Timezone for the booking',
    example: 'Europe/Madrid',
    default: 'Europe/Madrid',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Final price for the service',
    example: 2500,
  })
  @IsNumber()
  finalPrice: number;
}
