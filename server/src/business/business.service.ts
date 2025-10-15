import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Business, Prisma } from '@prisma/client';
import { UpdateBusinessDto } from './dto/updateBusiness.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(): Promise<Business[]> {
    return this.prisma.business.findMany();
  }

  async create(data: {
    name: string;
    ownerId: string;
    creatorRole?: string;
  }): Promise<Business> {
    if (data.creatorRole === 'CLIENT') {
      throw new ForbiddenException('Unauthorized to create a business');
    }
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { role: true },
    });
    if (!owner) {
      throw new NotFoundException('The property doesnt exist');
    }
    if (owner.role === 'CLIENT') {
      throw new ForbiddenException('Cannot asing a businnes to CLIENT role');
    }
    return this.prisma.business.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
      },
      include: {
        owner: true,
      },
    });
  }
  async delete(id: string): Promise<Business> {
    return this.prisma.business.delete({
      where: { id },
    });
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    try {
      return await this.prisma.business.update({
        where: { id },
        data: updateBusinessDto,
      });
    } catch (error: unknown) {
      // Si Prisma no encuentra el registro (código P2025)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Business with id ${id} not found`);
        }
      }
      // Otros errores se propagan
      throw error;
    }
  }
}
