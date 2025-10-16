import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Cut hair',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
  })
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  durationMin: number;

  @ApiProperty({
    description: 'Price in ARS',
    example: 2500,
  })
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'Business ID',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
  })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
