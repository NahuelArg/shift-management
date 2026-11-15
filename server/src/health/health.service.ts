import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface DatabaseHealthStatus extends HealthStatus {
  database: 'up';
  latencyMs: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: el proceso responde. No toca la base de datos. */
  check(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  /**
   * Readiness: ejecuta una consulta mínima contra PostgreSQL (Supabase).
   * Esto cuenta como actividad real y evita que el proyecto se pause por inactividad.
   */
  async checkDatabase(): Promise<DatabaseHealthStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
    return {
      ...this.check(),
      database: 'up',
      latencyMs: Date.now() - start,
    };
  }
}
