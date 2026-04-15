import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BusinessModule } from './business/business.module';
import { PrismaModule } from 'prisma/prisma.module';
import { BookingsModule } from './bookings/bookings.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    ServicesModule,
    BusinessModule,
    PrismaModule,
    BookingsModule,
    SchedulesModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard
  }],
})
export class AppModule { }
