import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService, } from '../../prisma/prisma.service';
import { Service } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/updateServices.dto';
import { BusinessWithServices } from './dto/businessWithService.dto';

@Injectable()


export class ServicesService {
  constructor(private readonly prisma: PrismaService) { }

  async getServicesByBusinessId(businessId: string, userId: string): Promise<Service[]> {
    if (!businessId || !userId) throw new BadRequestException('Args not provided')
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      },
      include: { services: true }
    });
    if (!business) throw new ForbiddenException('Forbidden')
    const service = business.services
    return service
  }

  async findAll(userId: string): Promise<BusinessWithServices[]> {
    if (!userId) throw new BadRequestException('Args not provided')
    const businessWithServices = await this.prisma.business.findMany({
      where: {
        ownerId: userId
      },
      select: {
        name: true,
        services: true,
      }
    });
    return businessWithServices
  }

  async create(data: CreateServiceDto, userId: string): Promise<Service> {
    const business = await this.prisma.business.findFirst({
      where: {
        id: data.businessId,
        ownerId: userId
      }
    })
    if (!business) throw new ForbiddenException('Forbidden')
    try {
      return await this.prisma.service.create({ data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A service with that name already exists');
        }
      }
      throw new InternalServerErrorException('Internal Server Error')
    }
  }
  async delete(id: string, userId: string, businessId: string): Promise<Service> {
    if (!id || !userId) throw new BadRequestException('Bad Request')
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });
    if (!business) throw new ForbiddenException('Forbidden')
    try {
      const service = await this.prisma.service.delete({
        where: {
          id,
          businessId
        },
      });
      return service
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Not Found');
        }
      }
      throw new InternalServerErrorException('Internal Server Error')
    }
  }
  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
    businessId: string
  ): Promise<Service> {
    if (!id || !userId) throw new BadRequestException('Bad Request')
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });
    if (!business) throw new ForbiddenException('Forbidden')
    try {
      return await this.prisma.service.update({
        where: {
          id,
          businessId
        },
        data: updateServiceDto,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new NotFoundException('Not Found');
      }
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  async getServicesByEmployee(employeeId: string): Promise<Service[]> {
    if (!employeeId) throw new BadRequestException('Bad Request')
    const user = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        businessId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Not Found');
    }

    if (!user.businessId) {
      throw new UnprocessableEntityException('Employee is not assigned to any business');
    }

    return await this.prisma.service.findMany({
      where: { businessId: user.businessId },
      orderBy: { name: 'asc' },
    });
  }
}
