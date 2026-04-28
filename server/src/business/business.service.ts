import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Business, } from '@prisma/client';
import { UpdateBusinessDto } from './dto/updateBusiness.dto';
import { PublicBusinessDto } from "./dto/PublicBusinessDto.dto";

const PUBLIC_OWNER_SELECT = {
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
  },
} as const
@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Obtener TODOS los negocios del usuario
   * Usado por: GET /business (lista todos)
   * Return: Business[]
   */
  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    if (!userId) {
      throw new BadRequestException('User Id is required');
    }
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      include: { services: true, },
      orderBy: { createdAt: 'desc' },
    });
    return businesses;
  }
  /**
   * Get all business on public way (Not filter by user)
   * Used by: GET /business/public
   * Return: Business[]
   * Note: This method not filter by ownerId, return all business for clients. (Public)
   */
  async getAllBusinessesPublic(): Promise<PublicBusinessDto[]> {
    const businesses = await this.prisma.business.findMany({
      select: {
        id: true,
        name: true,
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
          },
        },
      },
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
    if (businesses.length === 0) {
      throw new NotFoundException('Businesses not found');
    }
    return businesses
  }

  /**
   * Get a business by id
   * Used by : GET /business/:id
   * Return: Business
   * Validation: Verify ownership if userId is on the params
   */
  // TODO: Optimize with _count and lazy-load services. See issue #47
  async getBusinessById(businessId: string, userId: string): Promise<Business> {
    if (!businessId || !userId) {
      throw new BadRequestException('Business ID required');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: PUBLIC_OWNER_SELECT,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this business',
      );
    }

    return business;
  }

  /**
    * Create a business with role validation and owner existence check
    * Use by POST /business
    * Return: Business
    */
  async create(data: {
    name: string;
    ownerId: string;
  }): Promise<Business> {
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { role: true },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    if (owner.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only users with ADMIN role can create a business',
      );
    }

    return await this.prisma.business.create({
      data:{
        name: data.name,
        ownerId: data.ownerId,
      },
      include: {
        owner: PUBLIC_OWNER_SELECT,
      },
    });
  }
  /**
   *  Update business
   * Verify that the user is the owner before allowing update
   * Use by PUT /business/:id
   * Return: Business 
   */
  async update(
    businessId: string,
    updateData: UpdateBusinessDto,
    userId: string,
  ): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business  ${businessId} not found`);
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this business',
      );
    }

    return this.prisma.business.update({
      where: { id:businessId },
      data: updateData,
      include: {
        owner: PUBLIC_OWNER_SELECT
      }
    });
  }


  /**
  *  Delete with ownership validation
  * Verify before to delete the user is owner of the business
  */
  async delete(
    businessId: string,
    userId: string,
  ): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id:businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business not found`);
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this business',
      );
    }

    return this.prisma.business.delete({
      where: { id: businessId },
      include: {
        owner: PUBLIC_OWNER_SELECT,
      },
    });
  }
}