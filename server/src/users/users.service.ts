import { Injectable } from '@nestjs/common';
import {PrismaService} from '../../prisma/prisma.service';
import {User} from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}
    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    async createUser(data: { name: string; email: string; phone? : string }): Promise<User> {
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
            },
        });
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
}
