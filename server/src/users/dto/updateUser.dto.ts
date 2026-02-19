import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './CreateUserDto.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
