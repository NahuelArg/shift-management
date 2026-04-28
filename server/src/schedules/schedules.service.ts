import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Schedule } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';
import { toMinutes } from '../utils/toMinutes';
@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) { }

  async findAll(userId: string): Promise<Schedule[]> {
    if (!userId) throw new BadRequestException('userId is not provided')
    const business = await this.prisma.business.findMany({
      where: {
        ownerId: userId
      }
    })
    const businessIds = business.map((e) => e.id)
    const schedules = await this.prisma.schedule.findMany(
      {
        where: {
          businessId: { in: businessIds }
        }
      }

    )
    return schedules;
  }
  async findOne(id: string): Promise<Schedule> {
    if (!id) throw new BadRequestException('ID IS NOT PROVIDED')
    const schedule = await this.prisma.schedule.findUnique({ where: { id } })
    if (!schedule) throw new NotFoundException('Schedule not found')
    return schedule;
  }
  async create(data: CreateScheduleDto): Promise<Schedule> {
    const minutesFrom = toMinutes(data.from)
    const minutesTo = toMinutes(data.to)
    if (minutesFrom >= minutesTo) {

      throw new BadRequestException('start time must be before end time');
    }
    return this.prisma.schedule.create({
      data,
    });
  }
  async delete(
    id: string,
    userId: string
  ): Promise<Schedule> {
    if (!id || !userId) throw new BadRequestException('args not provided')

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: id }
    });
    if (!schedule) throw new NotFoundException('Schedule not found')
    const business = await this.prisma.business.findUnique({
      where: { id: schedule.businessId }
    })
    if (!business) throw new NotFoundException('Business not found')
    if (business.ownerId != userId) throw new ForbiddenException('You do not have acces to delete this schedule')
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    userId: string
  ): Promise<Schedule> {
    if (!id || !userId) throw new BadRequestException('ARG not provided')
    const currentSchedule = await this.prisma.schedule.findUnique({ where: { id: id } })
    if (!currentSchedule) throw new NotFoundException('ID schedule is not in DATABASE')
    const business = await this.prisma.business.findUnique({ where: { id: currentSchedule?.businessId } })
    if (!business) throw new NotFoundException('ID business is not in DATABASE')
    if(business.ownerId != userId) throw new ForbiddenException('Not Authorized to update this schedule')
    const from = updateScheduleDto.from ?? currentSchedule!.from
    const to = updateScheduleDto.to ?? currentSchedule!.to
    const minutesFrom = toMinutes(from)
    const minutesTo = toMinutes(to)

    if (minutesFrom >= minutesTo) {
      throw new BadRequestException('start time must be before end time');
    }
    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
    });
  }
}
