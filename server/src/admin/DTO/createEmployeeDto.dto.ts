import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'empleado@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '44898053-404e-4d78-98e3-eb05d2753fce' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ example: 'EMPLOYEE' })
  @IsString()
  role: string;

  @ApiProperty({ example: 'LOCAL' })
  @IsString()
  authProvider: string;
}