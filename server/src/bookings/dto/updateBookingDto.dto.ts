import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '@prisma/client'; // Para el tipo BookingStatus

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Date of the booking',
    example: '2025-07-18T18:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: 'PENDING',
    required: false,
  })

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
  @IsOptional()
  @ApiPropertyOptional({
    description: 'ID of the user who made the booking',
    example: 'user123',
    required: false,
  })
  userId?: string;
}
