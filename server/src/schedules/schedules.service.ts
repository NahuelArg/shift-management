import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Schedule } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';
@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Schedule[]> {
    const schedules = await this.prisma.schedule.findMany();
    if (!schedules || schedules.length === 0) {
      throw new NotFoundException('No schedules found');
    }

    return schedules;

  }

  async create(data: CreateScheduleDto): Promise<Schedule> {
    if(data.from >= data.to) {
      throw new BadRequestException('start time must be before end time');
    }
    return this.prisma.schedule.create({
      data,
    });
  }
  async delete(id: string): Promise<Schedule> {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
   if (updateScheduleDto.from && updateScheduleDto.to && updateScheduleDto.from >= updateScheduleDto.to) {
  throw new BadRequestException('start time must be before end time');
}
return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
    });
  }
}
