import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Service } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/updateServices.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBy(businessId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { businessId },
    });
  }

  async findAll(): Promise<Service[]> {
    return this.prisma.service.findMany();
  }

  async create(data: CreateServiceDto): Promise<Service> {
    if (data.durationMin <= 0)
      throw new BadRequestException('DurationMin must be at least 1 minute');
    return this.prisma.service.create({
      data,
    });
  }
  async delete(id: string): Promise<Service> {
    return this.prisma.service.delete({
      where: { id },
    });
  }
  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    try {
      return await this.prisma.service.update({
        where: { id },
        data: updateServiceDto,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(`Error updating service: ${error.message}`);
      }
      throw new InternalServerErrorException('Error updating service: Unknown error');
    }
  }

  async getServicesByEmployee(employeeId: string): Promise<Service[]> {
    // First get the employee's business
    const user = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { businessId: true },
    });

    if (!user || !user.businessId) {
      throw new BadRequestException('Employee is not assigned to any business');
    }

    // Get all services for that business
    return this.prisma.service.findMany({
      where: { businessId: user.businessId },
      orderBy: { name: 'asc' },
    });
  }
}
