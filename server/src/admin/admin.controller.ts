import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Request,
  Put,
  Param,
  NotFoundException,
  Query,
  Delete,
} from '@nestjs/common';
import { GetAllEmployeesQueryDto } from './DTO/getAllEmployeesQuery.dto';
import { RequestWithUser } from 'src/types/express-request.interface';
import { Roles } from '../decorator/roles.decorator';
import { RolesGuard } from '../guard/roles.guard';
import {JwtAuthGuard} from 'src/guard/jwt.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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
  constructor(private readonly adminService: AdminService) {}

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
  async getAdminById(@Request() req: RequestWithUser): Promise<UserDto> {
    const id = req.user.userId;
    const admin = await this.adminService.getAdminById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  @Get('business/:businessId/employees')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all employees for a business' })
async getEmployeesByBusiness(
  @Request() req: RequestWithUser,
  @Param('businessId') businessId: string,
) {
  return this.adminService.getEmployeesByBusiness(
    businessId,
    req.user.userId,
  );
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
  async deleteEmployee(@Param('id') req: RequestWithUser): Promise<void> {
    await this.adminService.deleteEmployee(req.user.userId);
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
  getDashboard(@Request() req: RequestWithUser) {
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
    @Request() req: RequestWithUser,
    @Query('businessId') businessId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: string,
  ) {
    const userId = req.user.userId;

    return this.adminService.getAllMetrics(
      businessId,
      userId,
      from,
      to,
      groupBy,
    );
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
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }
  @Put(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<UserDto> {
    const admin = await this.adminService.updateAdmin(id, updateAdminDto);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(
    @Request() req: RequestWithUser,
    @Query() query: GetAllEmployeesQueryDto,
  ) {
    const adminId = req.user.userId;
    return this.adminService.getAllEmployees(adminId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('employee')
  async createEmployee(
    @Request() req: RequestWithUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.adminService.createEmployee(dto, req.user.userId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Put('employee/:employeeId')
  async updateEmployee(
    @Request() req: RequestWithUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.adminService.updateEmployee(
      dto,
      req.user.userId,
      employeeId,
    );
  }

}
