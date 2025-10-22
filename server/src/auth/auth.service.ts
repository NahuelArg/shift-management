import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/RegisterDto.dto'; // Cambié CreateUserDto a RegisterDto
import { LoginDto } from './dto/LoginDto.dto';
import { UserDto } from 'src/users/dto/UserDto.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }


  async register(data: RegisterDto): Promise<UserDto> {
  const { email, password, name, authProvider = 'LOCAL' } = data;

  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new UnauthorizedException('Email already exists');
  }

  let hashedPassword: string | null = null;

  if (authProvider === 'LOCAL') {
    // ✅ Validación manual completa
    if (!password || password.trim().length === 0) {
      throw new BadRequestException('Password is required for local registration');
    }
    
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      authProvider,
      role: Role.CLIENT,
    },
    include: {
      bookings: true,
    },
  });

  return this.transformToUserDto(user);
}

  private transformToUserDto(user: any): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      createdAt: user.createdAt,
      bookings: user.bookings || [],
      authProvider: user.authProvider,
      password: null,
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: UserDto }> {
    const { email, password } = loginDto;

    if (!email || !email.includes('@')) {
      throw new UnauthorizedException('Please enter a valid email address');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    if (user.authProvider !== 'LOCAL') {
      throw new UnauthorizedException(`Please log in using ${user.authProvider}`);
    }
    if (!user.password) {
      throw new UnauthorizedException('This account does not have a password set. Please use social login');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('The password you entered is incorrect');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });

    return { accessToken: token, user: this.transformToUserDto(user) };
  }
}
