import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'user password',
    example: 'my_password',
  })
  @IsString()
  password: string;


}