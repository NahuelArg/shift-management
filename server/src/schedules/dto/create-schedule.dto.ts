import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Weekday (0=Sunday, 6=Saturday)',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  dayOfWeek: number;

  @ApiProperty({
    description: 'Start time',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Business ID',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
  })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
