import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [ServicesService, JwtService],
  controllers: [ServicesController],
})
export class ServicesModule {}
