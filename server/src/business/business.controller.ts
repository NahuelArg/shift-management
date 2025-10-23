import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Param,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { RequestWithUser } from 'src/types/express-request.interface';
import { BusinessService } from './business.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BusinessDto } from './dto/BusinessDto.dto'; // Asumiendo que vamos a crear un DTO para la respuesta
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { CreateBusinessDto } from './dto/Create-Business.dto';
import { UpdateBusinessDto } from './dto/updateBusiness.dto';

@ApiTags('business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business deleted successfully',
    type: BusinessDto,
  })
  async delete(@Param('id') id: string): Promise<BusinessDto> {
    return this.businessService.delete(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({
    status: 200,
    description: 'List of businesses retrieved successfully',
    type: [BusinessDto],
  })
  async findAll(): Promise<BusinessDto[]> {
    return this.businessService.findAll();
  }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    type: BusinessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error creating business',
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to create business',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() body: CreateBusinessDto,
  ): Promise<BusinessDto> {
    return this.businessService.create({
      creatorRole: req.user.role,
      ...body,
    });
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: BusinessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error updating business',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessDto> {
    const business = await this.businessService.update(id, updateBusinessDto);
    if (!business) {
      throw new Error('Business not found');
    }
    return business;
  }
}
