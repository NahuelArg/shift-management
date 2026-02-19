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
import { BusinessDto } from './dto/BusinessDto.dto';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { CreateBusinessDto } from './dto/Create-Business.dto';
import { UpdateBusinessDto } from './dto/updateBusiness.dto';
import {PublicBusinessDto} from "./dto/PublicBusinessDto.dto";

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  /**
   * Obtener todos los negocios del usuario autenticado
   * GET /business
   * Retorna: BusinessDto[]
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all businesses for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of businesses retrieved successfully',
    type: [BusinessDto],
  })
  async findAll(@Req() req: RequestWithUser): Promise<BusinessDto[]> {
    const userId = req.user.userId;
    // ✅ Ahora llama al método correcto que retorna array
    return this.businessService.getBusinessesByUserId(userId);
  }
  /**
   *Obtener todos los negocios de manera publica (sin autenticación)
   * GET /business/public
   * Retorna: BusinessDto[]
   */
  @Get('public')
  @ApiOperation({ summary: 'Get all businesses (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of businesses retrieved successfully',
    type: [PublicBusinessDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAllPublic(): Promise<PublicBusinessDto[]> {
    // ✅ Retorna todos los negocios sin filtrar por usuario
    return this.businessService.getAllBusinessesPublic();
  }

  /**
   * Obtener un negocio específico por ID
   * GET /business/:id
   * Retorna: BusinessDto
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiResponse({
    status: 200,
    description: 'Business retrieved successfully',
    type: BusinessDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner of this business',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async getById(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<BusinessDto> {
    const userId = req.user.userId;
    // ✅ Ahora retorna un objeto específico
    return this.businessService.getBusinessById(id, userId);
  }

  /**
   * Crear un nuevo negocio
   * POST /business
   * Retorna: BusinessDto
   */
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
      owner: {
        role: req.user.role,
      },
      ...body,
    });
  }

  /**
   * Actualizar un negocio
   * PUT /business/:id
   * Retorna: BusinessDto
   */
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner of this business',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Req() req: RequestWithUser,
  ): Promise<BusinessDto> {
    const userId = req.user.userId;
    return this.businessService.updateWithOwnershipCheck(
      id,
      updateBusinessDto,
      userId,
    );
  }

  /**
   * Eliminar un negocio
   * DELETE /business/:id
   * Retorna: BusinessDto (el que fue eliminado)
   */
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner of this business',
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<BusinessDto> {
    const userId = req.user.userId;
    return this.businessService.deleteWithOwnershipCheck(id, userId);
  }
}