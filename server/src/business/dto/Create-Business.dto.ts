import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Beauty Salon',
  })
  @IsString()
  name!: string;
}
