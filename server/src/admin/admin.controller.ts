import { Controller, Get, UseGuards, Post, Body, Request, Put, Param, NotFoundException, Query, Delete, } from '@nestjs/common';
import { Roles } from '../decorator/roles.decorator';
import { RolesGuard } from '../guard/roles.guard';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UserDto } from '../users/dto/UserDto.dto';
import { UpdateAdminDto } from './DTO/updateAdmin.dto';
import MetricsResponse from './DTO/metricsDto.dto';
import { CreateAdminDto } from './DTO/createAdminDto.dto';
import { CreateEmployeeDto } from './DTO/createEmployeeDto.dto';


@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('me')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: UserDto,
  })
  async getAdminById(@Request() req: any): Promise<UserDto> {
    const id = req.user.userId;
    const admin = await this.adminService.getAdminById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete admin by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully',
  })
  async deleteEmployee(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteEmployee(id);
  }

  @Get('dashboard')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: UserDto, 
  })
  getDashboard(@Request() req: any) {
    const userId = req.user.userId;
    return this.adminService.getDashboard(userId);
  }

  @Get('metrics')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin metrics' })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: MetricsResponse, 
  })
  getAllMetrics(
    @Request() req,
    @Query('businessId') businessId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: string) {
    const userId = req.user.userId; 
    
    return this.adminService.getAllMetrics(businessId, userId, from, to, groupBy);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('/admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new employer user' })
  @ApiResponse({
    status: 201,
    description: 'Employer created successfully',
    type: CreateAdminDto,
  })
  async createAdmin(@Body() dto: CreateAdminDto, @Request() req: any) {
    return this.adminService.createAdmin(dto);
  }
  @Put(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto): Promise<UserDto> {
    const admin = await this.adminService.updateAdmin(id, updateAdminDto);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }


  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(@Request() req, @Query() query) {
    return this.adminService.getAllEmployees(req.user.userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('employee')
  async createEmployee(@Request() req, @Body() dto: CreateEmployeeDto) {
    return this.adminService.createEmployee(dto, req.user.userId);
  }

}
