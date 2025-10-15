import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Service } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/updateServices.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Service[]> {
    return this.prisma.service.findMany();
  }

  async create(data: CreateServiceDto): Promise<Service> {
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
        throw new Error(`Error updating service: ${error.message}`);
      }
      throw new Error('Error updating service: Unknown error');
    }
  }
}
