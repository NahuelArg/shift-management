import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
@Module({
  providers: [BookingsService, PrismaService, JwtService],
  controllers: [BookingsController],
})
export class BookingsModule {}
