import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateServiceDto } from './create-service.dto';
export class ServiceDto extends CreateServiceDto {
  @ApiProperty({
    description: 'Service ID',
    example: '572ba60c-1fc5-4bc3-8472-afee5062b0e1',
  })
  @IsUUID()
  id: string;
}
