import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Service } from '@prisma/client';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ServiceDto } from './dto/service.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/updateServices.dto';
import { RequestWithUser } from '../types/express-request.interface';
import { BusinessWithServices } from './dto/businessWithService.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, type: [ServiceDto] })
  async findAll(@Request() req: RequestWithUser): Promise<BusinessWithServices[]> {
    return this.servicesService.findAll(req.user.userId);
  }

  @Get('my-business')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYEE')
  @ApiOperation({ summary: 'Get services from employee\'s business (EMPLOYEE)' })
  @ApiResponse({ status: 200, type: [ServiceDto] })
  async getMyBusinessServices(@Request() req: RequestWithUser): Promise<Service[]> {
    return this.servicesService.getServicesByEmployee(req.user.userId);
  }

  @Delete(':businessId/:id')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un servicio por ID' })
  @ApiResponse({
    status: 200,
    description: 'Servicio eliminado',
    type: ServiceDto,
  })
  async delete(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Param('businessId') businessId: string)
    : Promise<Service> {
    return this.servicesService.delete(id, req.user.userId, businessId);
  }


  @Get(':businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, type: [ServiceDto] })
  async findById(
    @Param('businessId') businessId: string,
    @Request() req: RequestWithUser)
    : Promise<Service[]> {
    return this.servicesService.getServicesByBusinessId(businessId, req.user.userId,);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new service' })
  @ApiResponse({ status: 201, type: ServiceDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() body: CreateServiceDto)
    : Promise<Service> {
      return this.servicesService.create(body,req.user.userId);
  }
  @Put(':businessId/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service by ID' })
  @ApiResponse({ status: 200, type: ServiceDto })
  async update(
    @Param('id') id: string,
    @Param('businessId') businessId: string,
    @Request() req: RequestWithUser,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return await this.servicesService.update(id, updateServiceDto, req.user.userId, businessId);
  }
}
