import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  BadRequestException,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Service } from '@prisma/client';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { ServiceDto } from './dto/service.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/updateServices.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un servicio por ID' })
  @ApiResponse({
    status: 200,
    description: 'Servicio eliminado',
    type: ServiceDto,
  })
  async delete(@Param('id') id: string): Promise<Service> {
    return this.servicesService.delete(id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, type: [ServiceDto] })
  async findAll(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new service' })
  @ApiResponse({ status: 201, type: ServiceDto })
  async create(@Body() body: CreateServiceDto): Promise<Service> {
    try {
      return this.servicesService.create(body);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Unknown error occurred');
    }
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service by ID' })
  @ApiResponse({ status: 200, type: ServiceDto })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.servicesService.update(id, updateServiceDto);
    if (!service) {
      throw new BadRequestException('Service not found');
    }
    return service;
  }
}
