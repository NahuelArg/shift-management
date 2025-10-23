# Análisis Arquitectónico - Sistema de Gestión de Turnos

## 1. Resumen Ejecutivo

Este proyecto es una aplicación full-stack de gestión de turnos y citas para negocios que permite a administradores gestionar empleados, servicios y reservas, mientras que los clientes pueden agendar citas. La arquitectura implementa un frontend React con Vite, un backend NestJS con autenticación JWT y OAuth (Google/Apple), y una base de datos MySQL gestionada con Prisma ORM. El sistema incluye funcionalidades avanzadas como gestión de caja registradora, control de roles (ADMIN/EMPLOYEE/CLIENT), y manejo de estados de reserva y pagos.

## 2. Diagrama de Componentes

```mermaid
graph TB
    subgraph "Frontend - React + Vite"
        A[Client App<br/>React 19.1.1<br/>TypeScript]
        A1[AuthContext<br/>Estado Global]
        A2[React Router<br/>Navegación]
        A3[Axios<br/>HTTP Client]
        A --> A1
        A --> A2
        A --> A3
    end

    subgraph "Backend - NestJS"
        B[NestJS App<br/>Port 3000]
        B1[Auth Module<br/>JWT + Passport]
        B2[Bookings Module]
        B3[Business Module]
        B4[Services Module]
        B5[Cash Register Module]
        B6[Admin Module]
        B7[Users Module]
        B --> B1
        B --> B2
        B --> B3
        B --> B4
        B --> B5
        B --> B6
        B --> B7
    end

    subgraph "Autenticación Externa"
        F1[Firebase Auth<br/>Google OAuth]
        F2[Apple OAuth]
    end

    subgraph "Base de Datos"
        D[(MySQL<br/>Prisma ORM)]
        D1[Users]
        D2[Business]
        D3[Bookings]
        D4[Services]
        D5[CashRegister]
        D6[CashMovement]
        D --> D1
        D --> D2
        D --> D3
        D --> D4
        D --> D5
        D --> D6
    end

    subgraph "Documentación & Observabilidad"
        E[Swagger UI<br/>/api endpoint]
    end

    A3 -->|REST API| B
    B1 -->|OAuth| F1
    B1 -.->|Pendiente| F2
    B -->|Prisma Client| D
    B --> E

    style A fill:#61DAFB
    style B fill:#E0234E
    style D fill:#4479A1
    style F1 fill:#FFCA28
    style E fill:#85EA2D
```

## 3. Análisis Técnico por Áreas

### 3.1 Estructura del Código

**Frontend (Client)**
- **Framework**: React 19.1.1 con TypeScript y Vite como bundler
- **Gestión de Estado**: Context API (AuthContext) para autenticación
- **Enrutamiento**: React Router DOM v7.8.1
- **Estilos**: Tailwind CSS 3.4.17
- **HTTP Client**: Axios 1.11.0
- **Estructura**:
  ```
  client/src/
  ├── components/      # Componentes reutilizables
  ├── pages/          # Vistas principales (login, dashboard, admin)
  ├── context/        # Context API para estado global
  └── services/       # Servicios de API
  ```

**Backend (Server)**
- **Framework**: NestJS 11.0.1 con TypeScript
- **ORM**: Prisma 6.18.0 (cliente) / 6.14.0 (CLI)
- **Autenticación**: JWT (@nestjs/jwt 11.0.0) + Passport
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Estructura Modular**:
  ```
  server/src/
  ├── auth/           # Autenticación y estrategias OAuth
  ├── users/          # Gestión de usuarios
  ├── business/       # Gestión de negocios
  ├── bookings/       # Reservas y citas
  ├── services/       # Servicios ofrecidos
  ├── schedules/      # Horarios
  ├── cash-register/  # Caja registradora
  ├── admin/          # Funcionalidades admin
  ├── guard/          # Guards de autorización
  └── decorator/      # Decoradores personalizados
  ```

**Puntos Fuertes**:
- ✅ Separación clara frontend/backend
- ✅ Arquitectura modular en NestJS
- ✅ TypeScript en todo el stack
- ✅ Uso de mejores prácticas de NestJS (DTOs, Guards, Decorators)

**Puntos Débiles**:
- ⚠️ No hay gestión de estado robusto en frontend (Redux/Zustand)
- ⚠️ Falta manejo centralizado de errores en frontend
- ⚠️ No hay lazy loading de rutas en React
- ⚠️ Importaciones relativas inconsistentes en backend

### 3.2 Modelado de Datos

**Schema Prisma** (`server/prisma/schema.prisma`):

**Modelos Principales**:
1. **User**: Usuarios del sistema con roles (CLIENT/ADMIN/EMPLOYEE)
2. **Business**: Negocios con relación 1:N a propietarios
3. **Service**: Servicios ofrecidos por los negocios
4. **Booking**: Reservas con estados y pagos
5. **Schedule**: Horarios de disponibilidad
6. **CashRegister**: Cajas registradoras
7. **CashMovement**: Movimientos de efectivo
8. **CashClosing**: Cierres de caja

**Puntos Fuertes**:
- ✅ Modelo de datos bien normalizado
- ✅ Uso apropiado de enums para estados
- ✅ Relaciones bien definidas (cascadas, set null)
- ✅ Índices en campos críticos (businessId, date, status)
- ✅ Soporte multi-timezone en bookings
- ✅ Sistema completo de gestión de caja

**Puntos Débiles**:
- ⚠️ Base de datos MySQL en schema pero README menciona PostgreSQL (inconsistencia)
- ⚠️ Falta soft delete (registros eliminados vs marcados como inactivos)
- ⚠️ No hay auditoría completa (quién modificó qué y cuándo)
- ⚠️ Campo `metadata` en CashMovement (Json) sin validación estructurada
- ⚠️ Falta validación a nivel de DB para horarios (ej: `from < to`)

### 3.3 Seguridad

**Implementación Actual**:
- ✅ JWT para autenticación
- ✅ Bcrypt para hash de contraseñas (v6.0.0)
- ✅ Guards de NestJS (JwtAuthGuard, RolesGuard)
- ✅ Decorador @Roles para control de acceso
- ✅ ValidationPipe global con whitelist
- ✅ CORS configurado

**Problemas Críticos de Seguridad**:

1. **ALTA - JWT_SECRET hardcodeado en .env.example sin rotación**
   - No hay mecanismo de rotación de secretos
   - El secreto es compartido y visible en el repositorio

2. **ALTA - CORS permite solo localhost en producción**
   - `main.ts` línea 9: `origin: 'http://localhost:5173'`
   - No usa variables de entorno para origins permitidos

3. **MEDIA - No hay rate limiting implementado**
   - Endpoints de login/register vulnerables a ataques de fuerza bruta
   - Swagger menciona 429 pero no está implementado

4. **MEDIA - Contraseñas sin requisitos de complejidad**
   - No hay validación de fuerza de contraseña
   - No hay política de expiración

5. **MEDIA - Tokens no tienen refresh mechanism**
   - JWT expira en 1 día pero no hay refresh tokens
   - Usuario debe re-login cada 24 horas

6. **BAJA - Headers de seguridad HTTP faltantes**
   - No usa Helmet.js
   - Sin CSP, HSTS, X-Frame-Options

7. **BAJA - Logs pueden exponer información sensible**
   - No hay sanitización de logs
   - `.catch(console.error)` en main.ts puede loguear datos sensibles

### 3.4 Testing

**Infraestructura de Testing**:
- Backend: Jest configurado
- Test files: `*.spec.ts` en cada módulo
- E2E tests: Configuración en `test/jest-e2e.json`

**Estado Actual**:
- ⚠️ Tests existen pero Jest no está instalado correctamente (error "jest: not found")
- ⚠️ No hay tests en frontend
- ⚠️ Coverage no está configurado para ejecutarse en CI/CD
- ⚠️ No hay tests de integración visibles

**Cobertura Estimada**: <10% (la mayoría son stubs generados por NestJS CLI)

### 3.5 Despliegue

**Configuración Actual**:
- ✅ Dockerfile simple para backend (Node 24-bullseye)
- ✅ Variables de entorno mediante .env
- ❌ No hay docker-compose para orquestación
- ❌ No hay CI/CD configurado (.github/workflows ausente)
- ❌ No hay healthcheck endpoints
- ❌ Dockerfile no optimizado (no multi-stage build)
- ❌ Frontend sin configuración de build para producción

**Problemas**:
1. Dockerfile copia todo (.) sin .dockerignore
2. `npm install` incluye devDependencies innecesarias
3. No hay scripts de migración automática de DB
4. Puerto 3000 hardcodeado en varios lugares

### 3.6 Observabilidad

**Estado Actual**:
- ✅ Swagger UI disponible en `/api`
- ❌ No hay logging estructurado (solo console.log/error)
- ❌ No hay monitoring (Prometheus, Grafana)
- ❌ No hay tracing distribuido
- ❌ No hay alertas configuradas
- ❌ No hay métricas de negocio

**Faltante Crítico**:
- Sin visibility de errores en producción
- No hay dashboards de performance
- Imposible debuggear issues en prod

### 3.7 Rendimiento

**Optimizaciones Presentes**:
- ✅ Índices en Prisma para queries frecuentes
- ✅ ValidationPipe con transform optimiza DTOs

**Problemas de Rendimiento**:
1. **N+1 Queries potenciales**: No hay evidencia de uso de `include` optimizado en Prisma
2. **Sin caché**: No hay Redis o caché en memoria para datos frecuentes
3. **Sin paginación**: Endpoints como `/bookings/all` pueden devolver datasets enormes
4. **Frontend sin code splitting**: Bundle completo en primera carga
5. **Sin CDN**: Assets servidos desde el mismo servidor
6. **Sin compresión**: No hay gzip/brotli configurado
7. **Prisma Client generado en build time**: No hay pre-generación

## 4. 10 Problemas o Riesgos Prioritarios

### P1: Secretos expuestos en repositorio (ALTA)
**Descripción**: Las claves JWT y credenciales OAuth están en archivos .env.example que pueden terminar committeados.

**Gravedad**: ALTA 🔴

**Evidencia**:
- `server/.env.example` líneas 5-8 contienen GOOGLE_CLIENT_ID/SECRET
- JWT_SECRET visible y sin rotación
- README.md muestra credenciales de ejemplo

**Solución**:
```bash
# 1. Usar gestores de secretos
npm install @nestjs/config dotenv-vault

# 2. Implementar en main.ts
import { ConfigService } from '@nestjs/config';

# 3. Agregar validación de ENV
- Crear schema de validación con Joi
- Fallar fast si faltan variables críticas

# 4. .gitignore estricto
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 5. Usar GitHub Secrets en CI/CD
```

### P2: Base de datos inconsistente (PostgreSQL vs MySQL) (ALTA)
**Descripción**: El schema.prisma usa MySQL pero el README menciona PostgreSQL.

**Gravedad**: ALTA 🔴

**Evidencia**:
- `prisma/schema.prisma` línea 6: `provider = "mysql"`
- `README.md` línea 125: `"postgresql://user:password@localhost:5432/dbname"`

**Solución**:
1. Decidir base de datos definitiva (recomendación: PostgreSQL para mejor soporte de JSON, UUID nativos)
2. Actualizar schema.prisma y README consistentemente
3. Crear migración para cambio si es necesario
4. Documentar decisión en ADR (Architecture Decision Record)

### P3: Sin Rate Limiting - Vulnerable a DDoS (ALTA)
**Descripción**: Endpoints críticos (login, register) sin protección contra ataques de fuerza bruta.

**Gravedad**: ALTA 🔴

**Evidencia**:
- `auth.controller.ts` no usa rate limiting
- Swagger menciona 429 pero no hay middleware

**Solución**:
```bash
npm install @nestjs/throttler

# En app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 10,  // 10 requests
    }]),
  ],
})

# En auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { limit: 3, ttl: 60000 } })
async login(@Body() loginDto: LoginDto) { ... }
```

### P4: Tests no funcionales (MEDIA)
**Descripción**: Infraestructura de testing existe pero Jest no ejecuta correctamente.

**Gravedad**: MEDIA 🟡

**Evidencia**:
- Ejecutar `npm run test` resulta en "jest: not found"
- package.json lista jest pero node_modules no lo tiene instalado correctamente

**Solución**:
```bash
# 1. Reinstalar dependencias
cd server
rm -rf node_modules package-lock.json
npm install

# 2. Verificar que jest esté instalado
npm list jest

# 3. Ejecutar tests
npm run test

# 4. Configurar pre-commit hook
npx husky init
echo "npm run test" > .husky/pre-push
```

### P5: CORS hardcodeado para localhost (MEDIA)
**Descripción**: Configuración CORS permite solo localhost, bloqueará frontend en producción.

**Gravedad**: MEDIA 🟡

**Evidencia**:
- `server/src/main.ts` línea 9: `origin: 'http://localhost:5173'`
- No usa variable de entorno ALLOWED_ORIGINS

**Solución**:
```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
});

// .env
ALLOWED_ORIGINS=http://localhost:5173,https://myapp.com,https://www.myapp.com
```

### P6: Sin paginación en endpoints críticos (MEDIA)
**Descripción**: Endpoints como `/bookings/all` pueden devolver miles de registros sin paginación.

**Gravedad**: MEDIA 🟡

**Evidencia**:
- `bookings.controller.ts` línea 55-61 método `findAll()` sin límite
- No hay DTOs para paginación

**Solución**:
```typescript
// pagination.dto.ts
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// bookings.controller.ts
@Get('all')
async findAll(@Query() paginationDto: PaginationDto) {
  return this.bookingsService.findAll(paginationDto);
}

// bookings.service.ts
async findAll(dto: PaginationDto) {
  const skip = (dto.page - 1) * dto.limit;
  return this.prisma.booking.findMany({
    skip,
    take: dto.limit,
  });
}
```

### P7: Vulnerabilidades en dependencias (MEDIA)
**Descripción**: npm audit reporta 14 vulnerabilidades (3 low, 11 moderate).

**Gravedad**: MEDIA 🟡

**Evidencia**:
```
14 vulnerabilities (3 low, 11 moderate)
To address issues that do not require attention, run:
  npm audit fix
```

**Solución**:
```bash
# 1. Revisar vulnerabilidades
cd server
npm audit

# 2. Actualizar automáticamente lo que se pueda
npm audit fix

# 3. Revisar breaking changes
npm audit fix --force

# 4. Actualizar manualmente las críticas
npm update <package-name>

# 5. Configurar Dependabot en GitHub
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/server"
    schedule:
      interval: "weekly"
```

### P8: Dockerfile no optimizado (BAJA)
**Descripción**: Dockerfile incluye todo el proyecto y no usa multi-stage builds.

**Gravedad**: BAJA 🟢

**Evidencia**:
- `server/Dockerfile` línea 5: `COPY . .`
- No hay .dockerignore
- Instala devDependencies innecesarias

**Solución**:
```dockerfile
# Dockerfile optimizado
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

# .dockerignore
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
.vscode
```

### P9: Sin logging estructurado (BAJA)
**Descripción**: Uso de console.log/error sin estructura, dificulta debugging en producción.

**Gravedad**: BAJA 🟢

**Evidencia**:
- `main.ts` línea 38: `.catch(console.error)`
- No hay logger configurado en NestJS

**Solución**:
```bash
npm install winston nest-winston

# logger.service.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});

// main.ts
app.useLogger(winstonLogger);
```

### P10: Frontend sin manejo de errores centralizado (BAJA)
**Descripción**: No hay interceptor de Axios ni error boundary en React.

**Gravedad**: BAJA 🟢

**Evidencia**:
- No hay configuración de interceptores en `client/src`
- Llamadas a API sin try/catch consistente

**Solución**:
```typescript
// client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <h1>Algo salió mal.</h1>;
    }
    return this.props.children;
  }
}
```

## 5. 6 Mejoras Concretas Priorizadas

### M1: Implementar Rate Limiting y Seguridad HTTP (Esfuerzo: S)
**Prioridad**: 1/6
**Esfuerzo**: Small (2-4 horas)
**Impacto**: Protege contra ataques comunes

**Pasos**:
1. Instalar dependencias:
   ```bash
   npm install @nestjs/throttler helmet
   ```

2. Configurar Throttler en `app.module.ts`:
   ```typescript
   ThrottlerModule.forRoot([{
     ttl: 60000,
     limit: 10,
   }])
   ```

3. Agregar Helmet en `main.ts`:
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

4. Aplicar throttling específico a auth endpoints

5. Testear con herramienta como `ab` (Apache Bench)

### M2: Configurar CI/CD con GitHub Actions (Esfuerzo: M)
**Prioridad**: 2/6
**Esfuerzo**: Medium (1-2 días)
**Impacto**: Automatización de testing y deployment

**Pasos**:
1. Crear `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm run lint
         - run: npm run test
         - run: npm run build
   ```

2. Crear workflow de deployment para staging/prod

3. Configurar secrets en GitHub (JWT_SECRET, DB credentials)

4. Agregar badge de CI en README

5. Configurar notificaciones de fallo

### M3: Agregar sistema de paginación y filtros (Esfuerzo: S)
**Prioridad**: 3/6
**Esfuerzo**: Small (4-6 horas)
**Impacto**: Mejora rendimiento y UX

**Pasos**:
1. Crear DTOs de paginación comunes:
   ```typescript
   // common/dto/pagination.dto.ts
   export class PaginationDto {
     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     page?: number = 1;

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(100)
     limit?: number = 10;
   }

   export class PaginatedResponseDto<T> {
     data: T[];
     meta: {
       total: number;
       page: number;
       limit: number;
       totalPages: number;
     };
   }
   ```

2. Implementar en BookingsService:
   ```typescript
   async findAll(dto: PaginationDto): Promise<PaginatedResponseDto<Booking>> {
     const [data, total] = await this.prisma.$transaction([
       this.prisma.booking.findMany({
         skip: (dto.page - 1) * dto.limit,
         take: dto.limit,
         orderBy: { createdAt: 'desc' },
       }),
       this.prisma.booking.count(),
     ]);

     return {
       data,
       meta: {
         total,
         page: dto.page,
         limit: dto.limit,
         totalPages: Math.ceil(total / dto.limit),
       },
     };
   }
   ```

3. Actualizar controladores para usar paginación

4. Implementar en frontend con componente de paginación

5. Testear con datasets grandes

### M4: Migrar gestión de estado a Zustand (Esfuerzo: M)
**Prioridad**: 4/6
**Esfuerzo**: Medium (1 día)
**Impacto**: Mejora mantenibilidad del frontend

**Pasos**:
1. Instalar Zustand:
   ```bash
   cd client
   npm install zustand
   ```

2. Crear store de autenticación:
   ```typescript
   // stores/authStore.ts
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   interface AuthState {
     user: User | null;
     token: string | null;
     login: (token: string, user: User) => void;
     logout: () => void;
   }

   export const useAuthStore = create<AuthState>()(
     persist(
       (set) => ({
         user: null,
         token: null,
         login: (token, user) => set({ token, user }),
         logout: () => set({ token: null, user: null }),
       }),
       {
         name: 'auth-storage',
       }
     )
   );
   ```

3. Migrar AuthContext a Zustand

4. Crear stores adicionales (bookings, services)

5. Actualizar componentes para usar stores

6. Eliminar Context API obsoleta

### M5: Implementar logging estructurado y monitoring (Esfuerzo: L)
**Prioridad**: 5/6
**Esfuerzo**: Large (2-3 días)
**Impacto**: Mejora observabilidad en producción

**Pasos**:
1. Instalar Winston + NestJS integration:
   ```bash
   npm install winston nest-winston
   ```

2. Configurar logger service:
   ```typescript
   // logger/logger.service.ts
   import { WinstonModule } from 'nest-winston';
   import * as winston from 'winston';

   export const createLogger = () => {
     return WinstonModule.createLogger({
       transports: [
         new winston.transports.Console({
           format: winston.format.combine(
             winston.format.timestamp(),
             winston.format.colorize(),
             winston.format.printf(({ timestamp, level, message, context }) => {
               return `${timestamp} [${context}] ${level}: ${message}`;
             }),
           ),
         }),
         new winston.transports.File({
           filename: 'logs/error.log',
           level: 'error',
           format: winston.format.json(),
         }),
         new winston.transports.File({
           filename: 'logs/combined.log',
           format: winston.format.json(),
         }),
       ],
     });
   };
   ```

3. Reemplazar console.log/error en todo el backend

4. Agregar correlation IDs para traceo

5. (Opcional) Integrar con servicio externo (Sentry, LogRocket)

6. Crear dashboards de métricas básicas

### M6: Optimizar Dockerfile y agregar Docker Compose (Esfuerzo: M)
**Prioridad**: 6/6
**Esfuerzo**: Medium (1 día)
**Impacto**: Facilita deployment y desarrollo local

**Pasos**:
1. Crear Dockerfile multi-stage optimizado (ver P8)

2. Crear `.dockerignore`:
   ```
   node_modules
   npm-debug.log
   .env
   .git
   dist
   coverage
   ```

3. Crear `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     db:
       image: mysql:8
       environment:
         MYSQL_ROOT_PASSWORD: root
         MYSQL_DATABASE: shift_management
       ports:
         - "3306:3306"
       volumes:
         - mysql_data:/var/lib/mysql

     backend:
       build: ./server
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: mysql://root:root@db:3306/shift_management
       depends_on:
         - db

     frontend:
       build: ./client
       ports:
         - "5173:5173"
       depends_on:
         - backend

   volumes:
     mysql_data:
   ```

4. Crear script de inicio: `npm run docker:dev`

5. Documentar uso de Docker en README

6. Testear build completo

## 6. Comandos y Checks Rápidos de Validación

```bash
# ============================================
# CHECKS DE INSTALACIÓN Y DEPENDENCIAS
# ============================================

# 1. Verificar instalación de dependencias del servidor
cd server
npm install
npm list --depth=0

# 2. Verificar instalación de dependencias del cliente
cd ../client
npm install
npm list --depth=0

# 3. Audit de seguridad
cd ../server
npm audit
npm audit fix

cd ../client
npm audit
npm audit fix

# ============================================
# CHECKS DE BASE DE DATOS
# ============================================

# 4. Verificar estado de Prisma y migraciones
cd ../server
npx prisma generate
npx prisma migrate status
npx prisma validate

# 5. Ver schema actual
npx prisma studio
# (Abre interfaz web en http://localhost:5555)

# ============================================
# CHECKS DE LINTING Y FORMATO
# ============================================

# 6. Linting del servidor
cd ../server
npm run lint

# 7. Linting del cliente
cd ../client
npm run lint

# 8. Formateo con Prettier (servidor)
cd ../server
npm run format

# ============================================
# CHECKS DE TESTING
# ============================================

# 9. Ejecutar tests unitarios
cd ../server
npm run test

# 10. Ejecutar tests con coverage
npm run test:cov

# 11. Tests E2E
npm run test:e2e

# ============================================
# CHECKS DE BUILD
# ============================================

# 12. Build del servidor
cd ../server
npm run build

# 13. Build del cliente
cd ../client
npm run build

# 14. Preview del build del cliente
npm run preview

# ============================================
# CHECKS DE SEGURIDAD ADICIONALES
# ============================================

# 15. Buscar secretos expuestos (requiere truffleHog)
docker run --rm -v "$(pwd):/repo" trufflesecurity/trufflehog:latest github --repo https://github.com/NahuelArg/shift-management

# 16. Análisis de vulnerabilidades con Snyk
npx snyk test

# 17. Verificar configuración CORS
cd ../server
grep -r "enableCors" src/

# 18. Verificar variables de entorno requeridas
cd ../server
grep -r "process.env" src/ | grep -v node_modules

# ============================================
# CHECKS DE RUNTIME
# ============================================

# 19. Iniciar servidor en modo desarrollo
cd ../server
npm run start:dev
# Verificar: http://localhost:3000/api (Swagger)

# 20. Iniciar cliente en modo desarrollo
cd ../client
npm run dev
# Verificar: http://localhost:5173

# 21. Healthcheck del backend
curl http://localhost:3000/
curl http://localhost:3000/api

# 22. Test de endpoint de autenticación
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# ============================================
# CHECKS DE DOCKER
# ============================================

# 23. Build de imagen Docker del servidor
cd ../server
docker build -t shift-management-server .

# 24. Ejecutar contenedor
docker run -p 3000:3000 shift-management-server

# 25. Verificar tamaño de imagen
docker images | grep shift-management

# ============================================
# CHECKS DE PERFORMANCE
# ============================================

# 26. Analizar bundle size del cliente
cd ../client
npm run build
npx vite-bundle-visualizer

# 27. Test de carga básico (requiere Apache Bench)
ab -n 100 -c 10 http://localhost:3000/

# 28. Verificar memoria del proceso Node
cd ../server
node --inspect dist/main.js
# Conectar Chrome DevTools para profiling

# ============================================
# CHECKS DE CÓDIGO
# ============================================

# 29. Buscar TODOs y FIXMEs
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" .

# 30. Verificar importaciones circulares
cd ../server
npx madge --circular --extensions ts src/

# 31. Análisis de complejidad ciclomática
npx complexity-report src/**/*.ts

# ============================================
# CHECKS DE DOCUMENTACIÓN
# ============================================

# 32. Verificar README actualizado
cat README.md

# 33. Verificar documentación de API
# Abrir http://localhost:3000/api en navegador

# 34. Generar documentación de tipos (si existe)
npx typedoc src/

# ============================================
# CHECKS DE GIT
# ============================================

# 35. Verificar archivos sin track
git status

# 36. Verificar .gitignore
cat .gitignore

# 37. Buscar archivos grandes en historial
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ {print substr($0,6)}' | sort --numeric-sort --key=2 | tail -10

# ============================================
# CHECKLIST FINAL ANTES DE DEPLOYMENT
# ============================================

# ✅ Todas las dependencias instaladas sin errores
# ✅ No hay vulnerabilidades críticas (npm audit)
# ✅ Prisma schema validado y migraciones aplicadas
# ✅ Linting pasa sin errores
# ✅ Tests pasan (al menos los que existen)
# ✅ Build exitoso (frontend y backend)
# ✅ Variables de entorno configuradas (.env)
# ✅ CORS configurado correctamente
# ✅ Swagger accesible
# ✅ Healthcheck responde
# ✅ Docker build exitoso
# ✅ Sin secretos en código
# ✅ README actualizado
```

## 7. Plan de Migración/Refactor en 3 Sprints

### Sprint 1: Seguridad y Estabilidad (2 semanas)
**Objetivo**: Resolver vulnerabilidades críticas y establecer bases sólidas

**Entregables**:
1. **Semana 1**:
   - ✅ Implementar rate limiting en auth endpoints (P3)
   - ✅ Configurar Helmet.js para headers de seguridad
   - ✅ Migrar secretos a variables de entorno seguras (P1)
   - ✅ Corregir configuración CORS dinámica (P5)
   - ✅ Resolver vulnerabilidades de npm audit (P7)
   - ✅ Documentación de configuración de entorno

2. **Semana 2**:
   - ✅ Decidir y migrar a base de datos definitiva (P2)
   - ✅ Crear migraciones necesarias
   - ✅ Implementar validación de contraseñas fuertes
   - ✅ Agregar refresh tokens al sistema de auth
   - ✅ Tests de integración para autenticación
   - ✅ Configurar .gitignore y .dockerignore correctamente

**Criterios de Aceptación**:
- ✅ npm audit no muestra vulnerabilidades críticas
- ✅ Rate limiting funcional (verificado con Apache Bench)
- ✅ Base de datos migrada sin pérdida de datos
- ✅ Todos los endpoints auth tienen tests

**Riesgos**:
- Migración de DB puede requerir downtime
- Cambios en auth pueden romper clientes existentes

### Sprint 2: Testing y CI/CD (2 semanas)
**Objetivo**: Automatizar calidad y deployment

**Entregables**:
1. **Semana 1**:
   - ✅ Reparar infraestructura de testing Jest (P4)
   - ✅ Escribir tests unitarios para servicios críticos (auth, bookings)
   - ✅ Configurar GitHub Actions CI (M2)
   - ✅ Agregar linting automático en pre-commit
   - ✅ Coverage mínimo de 60% en nuevos archivos

2. **Semana 2**:
   - ✅ Tests E2E para flujos principales
   - ✅ Configurar deployment automático a staging
   - ✅ Implementar healthcheck endpoints
   - ✅ Crear docker-compose para desarrollo local (M6)
   - ✅ Documentar proceso de CI/CD

**Criterios de Aceptación**:
- ✅ Pipeline CI ejecuta en cada PR
- ✅ Coverage >60% en servicios críticos
- ✅ Deployment a staging automático
- ✅ Docker compose levanta stack completo

**Riesgos**:
- Tests flaky pueden bloquear PRs
- Configuración inicial de CI puede llevar más tiempo

### Sprint 3: Optimización y Observabilidad (2 semanas)
**Objetivo**: Mejorar rendimiento y visibilidad

**Entregables**:
1. **Semana 1**:
   - ✅ Implementar paginación en todos los endpoints (M3, P6)
   - ✅ Optimizar queries de Prisma (detectar N+1)
   - ✅ Implementar logging estructurado con Winston (M5)
   - ✅ Agregar métricas básicas (Prometheus)
   - ✅ Optimizar Dockerfile multi-stage (P8)

2. **Semana 2**:
   - ✅ Migrar frontend a Zustand (M4)
   - ✅ Implementar error boundaries en React
   - ✅ Code splitting en rutas React
   - ✅ Configurar caché básico (Redis opcional)
   - ✅ Dashboard de monitoreo básico

**Criterios de Aceptación**:
- ✅ Todos los endpoints tienen paginación
- ✅ Logs estructurados en JSON
- ✅ Build de Docker <200MB
- ✅ Frontend carga inicial <500KB
- ✅ Métricas visibles en dashboard

**Riesgos**:
- Cambios en frontend pueden afectar UX
- Redis adiciona complejidad de infraestructura

### Post-Sprint: Backlog Técnico
**Para considerar en siguientes iteraciones**:
- Implementar soft delete en modelos críticos
- Agregar auditoría completa (createdBy, updatedBy)
- Migrar a TypeORM si se requiere queries más complejas
- Implementar notificaciones en tiempo real (WebSockets)
- Sistema de roles más granular (RBAC completo)
- Internacionalización (i18n)
- PWA para cliente móvil

## 8. Anti-patrones y Deuda Técnica Detectada

### Anti-patrón 1: God Object en Módulos
**Descripción**: Algunos servicios tienen demasiadas responsabilidades.

**Evidencia**:
- `BookingsService` maneja validación, lógica de negocio, y acceso a datos
- No hay separación clara de capas (Repository pattern ausente)

**Mitigación**:
```typescript
// Implementar Repository Pattern
// bookings.repository.ts
@Injectable()
export class BookingsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(options: FindOptions) {
    return this.prisma.booking.findMany(options);
  }
}

// bookings.service.ts (solo lógica de negocio)
@Injectable()
export class BookingsService {
  constructor(
    private repository: BookingsRepository,
    private validator: BookingValidator,
  ) {}

  async create(dto: CreateBookingDto) {
    await this.validator.validate(dto);
    return this.repository.create(dto);
  }
}
```

### Anti-patrón 2: Magic Strings
**Descripción**: Roles y estados como strings literales en código.

**Evidencia**:
- `@Roles('ADMIN', 'CLIENT')` usa strings literales
- Propenso a typos y difícil de refactorizar

**Mitigación**:
```typescript
// constants/roles.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  EMPLOYEE = 'EMPLOYEE',
}

// Uso
@Roles(UserRole.ADMIN, UserRole.CLIENT)
```

### Anti-patrón 3: Fat Controllers
**Descripción**: Controladores con lógica de negocio embebida.

**Evidencia**:
- `bookings.controller.ts` líneas 94-100 tiene validación de ownership

**Mitigación**:
- Mover validación a servicio
- Usar guards para autorización
- Controladores solo orquestan, no deciden

### Anti-patrón 4: Prisma Client directo en Servicios
**Descripción**: Servicios acceden directamente a `this.prisma`.

**Evidencia**:
- Acoplamiento fuerte con Prisma
- Dificulta testing y cambio de ORM

**Mitigación**:
- Implementar Repository Pattern
- Inyección de dependencias de repositorios
- Mockear repositorios en tests

### Anti-patrón 5: No hay DTOs de respuesta
**Descripción**: Controladores devuelven entidades de Prisma directamente.

**Evidencia**:
- `return this.bookingsService.findAll()` expone toda la entidad
- Puede leakear campos sensibles (ej: password hash)

**Mitigación**:
```typescript
// booking-response.dto.ts
export class BookingResponseDto {
  @Expose()
  id: string;

  @Expose()
  date: Date;

  @Expose()
  status: BookingStatus;

  // Excluir campos sensibles
}

// En controller
@Get()
@SerializeOptions({ strategy: 'excludeAll' })
async findAll(): Promise<BookingResponseDto[]> {
  return this.bookingsService.findAll();
}
```

### Deuda Técnica Acumulada

**Deuda de Documentación**:
- ❌ Sin ADRs (Architecture Decision Records)
- ❌ Sin diagramas de secuencia para flujos críticos
- ❌ Swagger incompleto (faltan ejemplos)
- ❌ Sin guía de contribución para desarrolladores

**Deuda de Testing**:
- ❌ Coverage real <10%
- ❌ Sin tests de integración completos
- ❌ Sin tests de performance/carga
- ❌ Frontend sin tests

**Deuda de Infraestructura**:
- ❌ Sin CI/CD configurado
- ❌ Sin monitoreo en producción
- ❌ Sin backups automáticos de DB
- ❌ Sin disaster recovery plan

**Deuda de Seguridad**:
- ❌ Sin análisis de seguridad automático (SAST/DAST)
- ❌ Sin política de rotación de secretos
- ❌ Sin auditoría de accesos
- ❌ Sin encriptación de datos sensibles en DB

**Estimación de Tiempo para Pagar Deuda**:
- Deuda crítica (seguridad + testing): 4-6 semanas
- Deuda importante (infraestructura + docs): 3-4 semanas
- Deuda menor (refactors + optimizaciones): 2-3 semanas
- **Total**: ~3-4 meses de trabajo dedicado

**Estrategia de Pago**:
1. **Inmediato** (Sprint 1): Seguridad crítica
2. **Corto plazo** (Sprint 2-3): Testing y CI/CD
3. **Medio plazo** (3-6 meses): Documentación y refactors
4. **Largo plazo** (6-12 meses): Optimizaciones avanzadas

## 9. Preguntas Abiertas

### Pregunta 1: Estrategia de Autenticación Externa
**Contexto**: El código incluye Firebase y estrategias de Google/Apple OAuth, pero la implementación de Apple está comentada.

**Pregunta**: 
¿Cuál es la prioridad de las integraciones OAuth? ¿Deberíamos:
- a) Completar la integración con Apple y activarla
- b) Enfocarnos solo en Google OAuth y remover Apple
- c) Agregar más proveedores (Facebook, Microsoft)
- d) Implementar Magic Links como alternativa sin contraseña

**Impacto en el Plan**: 
Si se requieren múltiples proveedores OAuth, necesitamos refactorizar la estrategia de autenticación en Sprint 1 y agregar tiempo de implementación (1-2 días por proveedor).

### Pregunta 2: Modelo de Negocio y Multi-tenancy
**Contexto**: El schema permite múltiples negocios (Business model) con relación a propietarios, pero no está claro el aislamiento de datos.

**Pregunta**:
¿El sistema operará como:
- a) SaaS multi-tenant (múltiples negocios aislados en una sola instancia)
- b) Instancia por cliente (cada negocio tiene su propia DB/deployment)
- c) Modelo híbrido (algunos recursos compartidos, otros aislados)

¿Se requiere aislamiento estricto de datos entre negocios? ¿Hay regulaciones de compliance (GDPR, HIPAA) que debamos considerar?

**Impacto en el Plan**:
- Multi-tenancy estricto requiere Row-Level Security y refactor significativo de queries (Sprint adicional)
- Compliance puede requerir auditoría completa y encriptación (2-3 semanas adicionales)

### Pregunta 3: Escalabilidad y Volumen Esperado
**Contexto**: No hay información sobre el volumen de usuarios, transacciones o datos esperados.

**Pregunta**:
¿Cuáles son las métricas esperadas en los próximos 6-12 meses?:
- Número de negocios concurrentes: ¿10, 100, 1000+?
- Reservas por día: ¿100, 1000, 10000+?
- Usuarios activos concurrentes: ¿50, 500, 5000+?
- Tamaño de base de datos: ¿GB, TB?

¿Hay picos estacionales o eventos que requieran manejo de tráfico especial?

**Impacto en el Plan**:
- Alta escala (1000+ negocios) requiere:
  - Implementar caché (Redis) - Sprint 3
  - Considerar sharding de DB - Post-Sprint
  - Implementar CDN para assets - Sprint 3
  - Queue system para tareas pesadas (Bull/BullMQ) - Sprint adicional
- Escala moderada (100-500 negocios):
  - Optimizaciones actuales suficientes
  - Monitoreo y alertas críticas - Sprint 3

---

**Documento generado**: Enero 2025  
**Versión**: 1.0  
**Próxima revisión**: Post-Sprint 1 (con métricas reales de implementación)
