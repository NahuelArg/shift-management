import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Schedule } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';
@Injectable()
export class SchedulesService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<Schedule[]> {
        return this.prisma.schedule.findMany();
    }

    async create(data: CreateScheduleDto): Promise<Schedule> {
        return this.prisma.schedule.create({
            data,   
        });
    }
    async delete(id: string): Promise<Schedule> {
        return this.prisma.schedule.delete({
            where: { id },
        });
    }
    async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
        return this.prisma.schedule.update({
            where: { id },
            data: updateScheduleDto,
        });
    }
}
