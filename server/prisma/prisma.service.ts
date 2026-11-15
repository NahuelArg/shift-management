import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      // Secure by default: el hash de la contraseña nunca sale de la base salvo
      // que una consulta lo pida explícitamente con `omit: { password: false }`
      // (solo el login lo necesita). Aplica también a relaciones anidadas.
      omit: { user: { password: true } },
    });
  }
}
