import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateBusinessDto {
  @ApiProperty({
    description: 'Business Name',
    example: 'Gym X',
    required: false,
  })
  @IsString()
  @ApiPropertyOptional()
  name?: string;
  
}
