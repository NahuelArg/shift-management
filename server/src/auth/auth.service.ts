import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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
  ) {}

  
  async register(data: RegisterDto): Promise<UserDto> {
    const { email, password, name, authProvider,} = data;

    console.log('📝 Register attempt for email:', email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      throw new UnauthorizedException('Email already exists');
    }

    console.log('🔒 Hashing password...');
    console.log('📝 Original password length:', password?.length);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('📝 Hashed password length:', hashedPassword?.length);

    console.log('👤 Creating new user...');
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

    console.log('👉 Login attempt for email:', email);

    // Validate email format
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email format');
      throw new UnauthorizedException('Please enter a valid email address');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    console.log('🔍 User found:', !!user);

    if (!user) {
      console.log('❌ No user found with email:', email);
      throw new NotFoundException('No account found with this email address');
    }

    console.log('⚡ Comparing passwords...');
    console.log('📝 Provided password length:', password?.length);
    console.log('📝 Stored hashed password length:', user.password?.length);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid?', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      throw new UnauthorizedException('The password you entered is incorrect');
    }

    console.log('✅ Password verified, generating token...');
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });

    return { accessToken: token, user: this.transformToUserDto(user) };
  }
}
