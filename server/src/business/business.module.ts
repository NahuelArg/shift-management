import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, JwtService]
})
export class BusinessModule {}
