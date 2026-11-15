import { Controller, Get, Head } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@ApiTags('Health')
@SkipThrottle() // Los pings periódicos no deben consumir el rate limit global
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check (no consulta la base de datos)' })
  @ApiResponse({ status: 200, description: 'El servidor está activo' })
  check() {
    return this.healthService.check();
  }

  // Algunos monitores (ej. UptimeRobot plan free) usan HEAD en lugar de GET
  @Head()
  head(): void {}

  @Get('db')
  @ApiOperation({ summary: 'Readiness check: ejecuta SELECT 1 en la base de datos' })
  @ApiResponse({ status: 200, description: 'Servidor y base de datos activos' })
  @ApiResponse({ status: 503, description: 'La base de datos no responde' })
  checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
