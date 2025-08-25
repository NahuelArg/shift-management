import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "../strategies/google.strategy";
//import { AppleStrategy } from "./strategies/apple.strategy";
import { PrismaService } from "prisma/prisma.service";
import { UsersModule } from "src/users/users.module";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "src/guard/jwt.guard";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async  (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      
    })],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy,PrismaService, JwtStrategy ]//AppleStrategy]
  ,exports: [AuthService]
})
export class AuthModule {}