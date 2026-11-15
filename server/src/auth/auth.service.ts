import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { hash, compare } from 'bcrypt';
import { RegisterDto } from './dto/RegisterDto.dto'; // Cambié CreateUserDto a RegisterDto
import { LoginDto } from './dto/LoginDto.dto';
import { UserDto } from '../users/dto/UserDto.dto';
import { Role } from '@prisma/client';

// Hash bcrypt válido de una contraseña aleatoria, usado solo para igualar tiempos
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6YVYmFQ7RnhrhQ5Gf7aJ8kPq3eU6';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto): Promise<UserDto> {
    const { email, password, name } = data;
    const authProvider = 'LOCAL';

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    let hashedPassword: string | null = null;

    if (authProvider === 'LOCAL') {
      // ✅ Validación manual completa
      if (!password || password.trim().length === 0) {
        throw new BadRequestException(
          'Password is required for local registration',
        );
      }

      if (password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }

      hashedPassword = await hash(password, 10);
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

  private transformToUserDto(user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: Role;
    businessId?: string | null;
    createdAt: Date;
    bookings?: any[];
    authProvider: 'LOCAL' | 'GOOGLE' | 'APPLE';
  }): UserDto {
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
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: UserDto }> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      omit: { password: false }, // único lugar que necesita el hash
    });

    // Siempre se ejecuta bcrypt (contra un hash señuelo si el usuario no existe)
    // y siempre se responde el mismo mensaje: así ni el texto ni el tiempo de
    // respuesta revelan qué emails están registrados (user enumeration).
    const passwordHash = user?.authProvider === 'LOCAL' ? user.password : null;
    const isPasswordValid = await compare(password, passwordHash ?? DUMMY_HASH);
    if (!user || !passwordHash || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });

    return { accessToken: token, user: this.transformToUserDto(user) };
  }
}
