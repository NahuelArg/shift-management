import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDate, IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client'; // Para el tipo BookingStatus

export class BookingDto {
  @ApiProperty({
    description: 'Unique identifier for the booking',
    example: 'c487eb36-16f7-4913-bfe2-9512c664a798',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'ID of the user who made the booking',
    example: '1cfc9fb7-238d-4583-9754-6aff4be64b73',
  })
  userId: string | null;

  @ApiProperty({
    description: 'ID of the service being booked',
    example: '572ba60c-1fc5-4bc3-8472-afee5062b0e1',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'ID of business where the booking was made',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'Date of the booking',
    example: '2025-07-18T18:00:00.000Z',
  })
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: 'PENDING',
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiProperty({
    description: 'Creation date of the booking',
    example: '2025-07-16T16:10:42.777Z',
  })
  @IsDate()
  createdAt: Date;
}
