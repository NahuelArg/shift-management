import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { CreateUserDto } from './CreateUserDto.dto';

export class UpdateUserDto extends CreateUserDto {}
