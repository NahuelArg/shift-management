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
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUserDto.dto';
import { UserDto } from './dto/UserDto.dto';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guard/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/updateUser.dto';
import { RequestWithUser } from 'src/types/express-request.interface';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
    type: UserDto,
  })
  async deleteUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser): Promise<UserDto> {
    return await this.usersService.delete(id, req.user.userId);
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  async findAll(@Request() req: RequestWithUser): Promise<UserDto[]> {
    return await this.usersService.findAll(req.user.userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({ summary: 'Search users by email (EMPLOYEE/ADMIN)' })
  @ApiResponse({ status: 200, description: 'List of users matching search', type: [UserDto] })
  async searchUsers(
    @Query('email') email: string,
    @Request() req: RequestWithUser): Promise<Omit<UserDto, 'password'>[]> {
    return await this.usersService.searchByEmail(email, req.user.userId);
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
    return await this.usersService.create(body)
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
    @Request() req: RequestWithUser
  ): Promise<UserDto> {
    return await this.usersService.update(id, updateUserDto, req.user.userId);
  }
}
