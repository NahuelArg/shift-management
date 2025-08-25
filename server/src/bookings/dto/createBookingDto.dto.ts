import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsUUID, IsOptional, IsString, IsNumber, IsEnum} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the user making the booking (will be taken from JWT token if not provided)',
    example: '1cfc9fb7-238d-4583-9754-6aff4be64b73',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'ID of the booked service',
    example: '572ba60c-1fc5-4bc3-8472-afee5062b0e1',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'ID of the business where the booking is made',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'Date and time of the booking (ISO 8601 format)',
    example: '2025-07-18T18:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    description: 'Client timezone',
    example: 'America/Argentina/Buenos_Aires',
    default: 'UTC'
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Cliente prefiere horario de tarde'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Final price for the booking',
    example: 2500,
  })
  @IsNumber()
  finalPrice: number;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    default: BookingStatus.PENDING
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}
