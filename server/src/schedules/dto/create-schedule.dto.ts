import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsNotEmpty, Matches, Max, Min } from 'class-validator';

// HH:MM en 24 h (00:00 a 23:59). Antes cualquier string pasaba y "abc" daba NaN.
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Weekday (0=Sunday, 6=Saturday)',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({
    description: 'Start time',
    example: '09:00',
  })
  @Matches(HH_MM, { message: 'from must be a time in HH:MM format' })
  from!: string;

  @ApiProperty({
    description: 'End time',
    example: '17:00',
  })
  @Matches(HH_MM, { message: 'to must be a time in HH:MM format' })
  to!: string;

  @ApiProperty({
    description: 'Business ID',
    example: '14d5613d-9786-45c4-8a12-a6cd9cb8e8e3',
  })
  @IsUUID()
  @IsNotEmpty()
  businessId!: string;
}
