import { Controller, Get, Post, Body, Delete, Param, UseGuards, BadRequestException, Put } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Schedule } from '@prisma/client';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { ScheduleDto } from './dto/schedulesDto.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted', type: ScheduleDto })
  async delete(@Param('id') id: string): Promise<Schedule> {
    return this.schedulesService.delete(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all schedules' })
  @ApiResponse({ status: 200, description: 'List of schedules', type: [ScheduleDto] })
  async findAll(): Promise<Schedule[]> {
    return this.schedulesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully', type: ScheduleDto })
  @ApiResponse({ status: 400, description: 'Error creating schedule' })
  async create(@Body() body: CreateScheduleDto): Promise<Schedule> {
    try {
      return await this.schedulesService.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated', type: ScheduleDto })
  @ApiResponse({ status: 400, description: 'Error updating schedule' })
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.schedulesService.update(id, updateScheduleDto);
    if (!schedule) {
      throw new BadRequestException('Schedule not found');
    }
    return schedule;
  }
}
