import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [SchedulesService, JwtService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
