import { ConflictException, Injectable, BadRequestException} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/CreateUserDto.dto';
import * as bcrypt from 'bcrypt'
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async findAll(): Promise<Omit<User, 'password'>[]> {
  return this.prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      authProvider: true,
      businessId: true,
      createdAt: true,
      bookings: true,
      updatedAt: true
    },
  });
  }

  async createUser(body: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where:{email:body.email}
    })
    if(existing) throw new ConflictException('Email already in use')
    if (body.authProvider === 'LOCAL' && !body.password) {
    throw new BadRequestException('Password is required for local authentication');
  }
    const hashedPassword = body.password
    ? await bcrypt.hash(body.password, 10)
    : undefined
    return this.prisma.user.create({
      data:{
        ...body,
        password: hashedPassword,
        phone: body.phone?? undefined
      }
    }
    );
  }
  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async searchByEmail(email: string): Promise<Omit<User, 'password'>[]> {
    return this.prisma.user.findMany({
      where: {
        email: {
          contains: email, 
          mode: 'insensitive',
        },
      },
      take: 10, // Limit to 10 results
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
  }
}
