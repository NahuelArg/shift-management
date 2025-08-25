import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaService } from '../prisma/prisma.service';
import { ServicesModule } from './services/services.module';
import { BusinessModule } from './business/business.module';
import { PrismaModule } from 'prisma/prisma.module';
import { BookingsModule } from './bookings/bookings.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule, 
    ServicesModule, 
    BusinessModule, 
    PrismaModule, 
    BookingsModule, 
    SchedulesModule, 
    AuthModule, 
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AuthService, JwtService],
})
export class AppModule {}
