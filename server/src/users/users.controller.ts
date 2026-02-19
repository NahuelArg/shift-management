import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Put,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUserDto.dto';
import { UserDto } from './dto/UserDto.dto';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { Roles } from '../decorator/roles.decorator';
import { RolesGuard } from '../guard/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/updateUser.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    type: UserDto,
  })
  async deleteUser(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.deleteUser(id);
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({ summary: 'Search users by email (EMPLOYEE/ADMIN)' })
  @ApiResponse({ status: 200, description: 'List of users matching search', type: [UserDto] })
  async searchUsers(@Query('email') email: string): Promise<Omit<UserDto, 'password'>[]> {
    if (!email || email.trim().length === 0) {
      throw new BadRequestException('Email query parameter is required');
    }
    return this.usersService.searchByEmail(email);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserDto,
  })
  async createUser(@Body() body: CreateUserDto): Promise<UserDto> {
    // Ensure 'phone' is undefined if null to match service signature
    const data = {
      ...body,
      phone: body.phone === null ? undefined : body.phone,
    };
    return this.usersService.createUser(data);
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: UserDto,
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.updateUser(id, updateUserDto);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
