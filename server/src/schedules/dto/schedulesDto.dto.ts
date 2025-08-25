import { ApiProperty } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class ScheduleDto extends CreateScheduleDto {
  @ApiProperty({
    description: 'Schedule ID',
    example: 'c0739fff-d821-4c0f-b7e9-b8cc151e4afb',
  })
  id: string;
}
