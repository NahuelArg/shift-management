import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { CreateBusinessDto } from './Create-Business.dto';

export class BusinessDto extends CreateBusinessDto {
  @ApiProperty({
    description: 'Unique identifier for the business',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Date when the business was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;
}
