import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateCashMovementDto {
  @ApiProperty({
    description: 'Movement type',
    enum: ['SALE', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT'],
    example: 'SALE',
  })
  @IsEnum(['SALE', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT'])
  type: 'SALE' | 'EXPENSE' | 'WITHDRAWAL' | 'DEPOSIT';

  @ApiProperty({
    description: 'Amount of the movement',
    example: 100.5,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['CASH', 'CARD', 'TRANSFER', 'MIXED'],
    example: 'CASH',
  })
  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'MIXED'])
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';

  @ApiPropertyOptional({
    description: 'Booking ID(if this is a sale)',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Movement description',
    example: 'Payment for order #1234',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
