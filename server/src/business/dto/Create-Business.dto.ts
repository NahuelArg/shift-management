import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Beauty Salon',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID of the business owner',
    example: '1cfc9fb7-238d-4583-9754-6aff4be64b73',
  })
  @IsUUID()
  ownerId: string;
}
