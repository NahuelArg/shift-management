import { ConflictException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/CreateUserDto.dto';
import * as bcrypt from 'bcrypt'
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }
  async findAll(userId: string): Promise<Omit<User, 'password'>[]> {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const businessIds = businesses.map(b => b.id);
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
      }
    });
  }

  async create(body: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email }
    })
    if (existing) throw new ConflictException('Email already in use')
    if (body.authProvider === 'LOCAL' && !body.password) {
      throw new BadRequestException('Password is required for local authentication');
    }
    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined
    return await this.prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
        phone: body.phone ?? undefined
      }
    }
    );
  }
  async delete(id: string, userId: string): Promise<User> {
    if (!id) throw new BadRequestException('args not provided')
    const userToDelete = await this.prisma.user.findFirst(
      {
        where: {
          id: id,
          business: {
            ownerId: userId
          }
        },
      })
    if (!userToDelete) throw new NotFoundException('user not found')
    return await this.prisma.user.delete({
      where: { id },
    });
  }
  async update(id: string, updateUserDto: UpdateUserDto, userId: string): Promise<User> {
    if (!id) throw new BadRequestException('args not provided')
    const userToUpdate = await this.prisma.user.findFirst(
      {
        where: {
          id: id,
          business: {
            ownerId: userId
          }
        },
      })
    if (!userToUpdate) throw new NotFoundException('user not found')
    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async searchByEmail(email: string, userId: string): Promise<Omit<User, 'password'>[]> {
    if (!email) throw new BadRequestException('args not provided')
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const businessIds = businesses.map(b => b.id);
    const userByEmail = await this.prisma.user.findMany({
      where: {
        businessId:{in:businessIds},
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      take: 10, 
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        authProvider: true,
        businessId: true,
      },
    });
    return userByEmail
  }
}
