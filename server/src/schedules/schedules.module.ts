import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [SchedulesService, PrismaService, JwtService],
  controllers: [SchedulesController],
})
export class SchedulesModule {}
