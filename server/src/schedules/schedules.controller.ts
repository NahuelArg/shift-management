import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  BadRequestException,
  Put,
  Request
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Schedule } from '@prisma/client';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ScheduleDto } from './dto/schedulesDto.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';
import { RequestWithUser } from '../types/express-request.interface';


@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule deleted',
    type: ScheduleDto,
  })
  async delete(
    @Request() req: RequestWithUser,
    @Param('id') id: string):
     Promise<Schedule> {
    return this.schedulesService.delete(id, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all schedules' })
  @ApiResponse({
    status: 200,
    description: 'List of schedules',
    type: [ScheduleDto],
  })
  async findAll(@Request() req:RequestWithUser): Promise<Schedule[]> {
    const userId = req.user.userId 
    return this.schedulesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Get Schedule by ID',
    type: ScheduleDto,
  })
  async findOne(@Param('id') id: string): Promise<Schedule> {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: ScheduleDto,
  })
  @ApiResponse({ status: 400, description: 'Error creating schedule' })
  async create(@Body() body: CreateScheduleDto): Promise<Schedule> {
    try {
      return await this.schedulesService.create(body);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
    }
    throw new BadRequestException('Unknown error occurred');
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated',
    type: ScheduleDto,
  })
  @ApiResponse({ status: 400, description: 'Error updating schedule' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const schedule = await this.schedulesService.update(id, updateScheduleDto, req.user.userId);
    if (!schedule) {
      throw new BadRequestException('Schedule not found');
    }
    return schedule;
  }
}
