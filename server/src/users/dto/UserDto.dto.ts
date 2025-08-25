import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, } from 'class-validator';
import { BookingDto } from '../../bookings/dto/BookingsDto.dto'; // Importa el DTO de Booking
import { CreateUserDto } from './CreateUserDto.dto';
export class UserDto extends CreateUserDto {
  @ApiProperty({
    description: 'User UUID',
    example: '1cfc9fb7-238d-4583-9754-6aff4be64b73',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Business ID the user belongs to (if any)',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  businessId?: string | null;

  @ApiProperty({
    description: 'User creation date',
    example: '2025-07-16T15:59:15.878Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Arrays of bookings associated with the user',
    type: [BookingDto],
    required: false,
  })
  bookings?: BookingDto[];




}
  