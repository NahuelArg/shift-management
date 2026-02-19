import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Business, Prisma } from '@prisma/client';
import { UpdateBusinessDto } from './dto/updateBusiness.dto';
import {PublicBusinessDto} from "./dto/PublicBusinessDto.dto";
@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener TODOS los negocios del usuario
   * Usado por: GET /business (lista todos)
   * Retorna: Business[]
   */
  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    return this.prisma.business.findMany({
      where: { ownerId: userId }, // ← Filtro automático por propietario
      include: {
        owner: true,
        services: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  /**
   * Obtener todos los negocios de manera pública (sin filtrar por usuario)
   * Usado por: GET /business/public
   * Retorna: Business[]
   * Nota: Este método no filtra por ownerId, retorna todos los negocios disponibles públicamente
   */
  async getAllBusinessesPublic(): Promise<PublicBusinessDto[]> {
    return this.prisma.business.findMany({
      select: {
        id: true,
        name: true,
        services:{
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener UN negocio específico por ID
   * Usado por: GET /business/:id
   * Retorna: Business
   * Validación: Verifica ownership si userId se proporciona
   */
  async getBusinessById(businessId: string, userId?: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: true,
        services: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    // Validación adicional si se proporciona userId
    if (userId && business.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este negocio',
      );
    }

    return business;
  }

  /**
   * Crear un negocio
   * Usado por: POST /business
   * Retorna: Business
   */
  async create(data: {
    name: string;
    ownerId: string;
    owner:{
      role: string;
    }
  }): Promise<Business> {
    // ✅ Validación: CLIENT no puede crear negocios
    if (data.owner.role === 'CLIENT') {
      throw new ForbiddenException(
        'Los clientes no pueden crear negocios',
      );
    }

    // Verifica que el owner existe y no es CLIENT
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { role: true },
    });

    if (!owner) {
      throw new NotFoundException('Usuario propietario no encontrado');
    }

    if (owner.role === 'CLIENT') {
      throw new ForbiddenException(
        'No se puede asignar un negocio a un usuario con rol CLIENT',
      );
    }

    // Crea el negocio
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

  /**
   *  Actualizar con validación de ownership
   * Verifica que el usuario es propietario antes de actualizar
   */
  async updateWithOwnershipCheck(
    id: string,
    updateData: UpdateBusinessDto,
    userId: string,
  ): Promise<Business> {
    // Verifica que el negocio existe
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con id ${id} no encontrado`);
    }

    // ✅ Valida que el usuario es el propietario
    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este negocio',
      );
    }

    // Actualiza
    return this.prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
      },
    });
  }


  /**
   *  Eliminar con validación de ownership
   * Verifica que el usuario es propietario antes de eliminar
   */
  async deleteWithOwnershipCheck(
    id: string,
    userId: string,
  ): Promise<Business> {
    // Obtiene el negocio
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con id ${id} no encontrado`);
    }

    // ✅ Valida que el usuario es el propietario
    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este negocio',
      );
    }

    // Elimina
    return this.prisma.business.delete({
      where: { id },
      include: {
        owner: true,
      },
    });
  }
}