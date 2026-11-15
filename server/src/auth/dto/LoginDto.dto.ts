import { NormalizeEmail } from '../../decorators/normalize-email.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'juan.perez@example.com',
  })
  @NormalizeEmail()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'my_secure_password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
