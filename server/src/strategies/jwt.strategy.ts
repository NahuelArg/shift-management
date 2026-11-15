import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'], // no aceptar otros algoritmos (p. ej. "none")
    });
  }

  /**
   * Se ejecuta en cada request autenticado, con la firma ya verificada.
   * Consultamos la base para que un usuario borrado o con el rol cambiado
   * pierda el acceso al instante, en vez de conservarlo hasta que venza el
   * token (24 h). Es una consulta por primary key: muy barata.
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { userId: user.id, email: user.email, role: user.role };
  }
}
