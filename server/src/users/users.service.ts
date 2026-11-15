import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/CreateUserDto.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async findAll(userId: string): Promise<Omit<User, 'password'>[]> {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const businessIds = businesses.map((b) => b.id);
    return await this.prisma.user.findMany({
      where: { businessId: { in: businessIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async create(body: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) throw new ConflictException('Email already in use');
    if (body.authProvider === 'LOCAL' && !body.password) {
      throw new BadRequestException(
        'Password is required for local authentication',
      );
    }
    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;
    return await this.prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
        phone: body.phone ?? undefined,
      },
    });
  }
  async delete(id: string, userId: string): Promise<User> {
    if (!id) throw new BadRequestException('args not provided');
    const userToDelete = await this.prisma.user.findFirst({
      where: {
        id: id,
        business: {
          ownerId: userId,
        },
      },
    });
    if (!userToDelete) throw new NotFoundException('user not found');
    return await this.prisma.user.delete({
      where: { id },
    });
  }
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ): Promise<User> {
    if (!id) throw new BadRequestException('args not provided');
    const userToUpdate = await this.prisma.user.findFirst({
      where: {
        id: id,
        business: {
          ownerId: userId,
        },
      },
    });
    if (!userToUpdate) throw new NotFoundException('user not found');
    const { password, ...rest } = updateUserDto;
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        // Antes la contraseña se guardaba en texto plano
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
  }

  /**
   * Búsqueda de clientes para crear reservas en nombre de ellos (ADMIN/EMPLOYEE).
   * - Coincidencia parcial: solo clientes que ya reservaron en los negocios del
   *   usuario (no se puede listar a los clientes de otros negocios).
   * - Email exacto: cualquier cliente, para poder darle su primer turno.
   * Antes filtraba por `businessId` de negocios propios: los clientes tienen
   * businessId = null y los empleados no son dueños, así que nunca devolvía nada.
   */
  async searchByEmail(
    email: string,
    actor: { userId: string; role: string },
  ): Promise<Pick<User, 'id' | 'name' | 'email' | 'phone'>[]> {
    const query = email?.trim().toLowerCase();
    if (!query || query.length < 3) {
      throw new BadRequestException('Search must have at least 3 characters');
    }

    let businessIds: string[] = [];
    if (actor.role === 'ADMIN') {
      const owned = await this.prisma.business.findMany({
        where: { ownerId: actor.userId },
        select: { id: true },
      });
      businessIds = owned.map((b) => b.id);
    } else {
      const me = await this.prisma.user.findUnique({
        where: { id: actor.userId },
        select: { businessId: true },
      });
      if (me?.businessId) businessIds = [me.businessId];
    }

    return this.prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
          { email: { equals: query, mode: 'insensitive' } },
          {
            email: { contains: query, mode: 'insensitive' },
            bookings: { some: { businessId: { in: businessIds } } },
          },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, phone: true },
    });
  }
}
