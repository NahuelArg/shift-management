import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto.dto';
import { RegisterDto } from './dto/RegisterDto.dto'
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiTags('Auth')
    @ApiOperation({
        summary: 'Login user',
        description: 'Authenticate user with email and password'
    })
    @ApiResponse({ status: 200, description: 'Successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or email format' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    @ApiResponse({ status: 403, description: 'Account is locked' })
    @ApiResponse({ status: 429, description: 'Too many login attempts' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }
}
