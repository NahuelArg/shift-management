<div align="center">

# Shift Management

**Sistema completo de gestión de turnos para negocios**

Reservas · Empleados · Servicios · Métricas — todo en un solo lugar

<p>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E.svg?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748.svg?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/deploy-Vercel-black.svg?logo=vercel" alt="Deploy Vercel" />
</p>

🇬🇧 [English version](./README.en.md)

**[Ver demo en vivo →](https://shift-management-livid.vercel.app)**

</div>

---

## Tabla de contenidos

- [Demo en vivo](#demo-en-vivo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Decisiones técnicas](#decisiones-técnicas)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [API Overview](#api-overview)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Testing](#testing)
- [Seguridad](#seguridad)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Autor](#autor)

---

## Demo en vivo

**[https://shift-management-livid.vercel.app](https://shift-management-livid.vercel.app)**

| Rol      | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin1@test.com        | password123 |
| Client   | client1@test.com       | password123 |
| Employee | employee1@test.com     | password123 |

---

## Screenshots

> _Reemplazar con capturas reales del proyecto en producción_

| Dashboard Admin | Gestión de Turnos | Vista Empleado |
|:-:|:-:|:-:|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## Features

- **Autenticación JWT** — Login seguro con roles diferenciados (Admin / Empleado / Cliente)
- **Sistema de Turnos** — Detección de conflictos, asignación automática de empleado disponible y soporte de timezone
- **Dashboard Admin** — Métricas de negocio por período (día/mes/año), gestión de empleados y configuración de horarios
- **Panel Empleado** — Vista de turnos asignados con actualización de estado
- **Panel Cliente** — Creación y seguimiento de reservas propias
- **API REST documentada** — Swagger/OpenAPI en `/api` con todos los endpoints
- **Multi-negocio** — Un admin puede gestionar varios negocios con servicios y horarios independientes

---

## Tech Stack

| Área | Tecnología |
|------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7 |
| **Backend** | NestJS 11, TypeScript, Passport JWT, class-validator |
| **ORM / DB** | Prisma 6, PostgreSQL 16 |
| **Autenticación** | JWT + bcrypt, estrategias Passport (Google/Apple preparadas) |
| **Documentación** | Swagger / OpenAPI |
| **Testing** | Jest 29, ts-jest, Supertest |
| **Deploy** | Vercel (frontend), Render (backend), Supabase (DB) |

---

## Decisiones técnicas

| Decisión | Razón |
|----------|-------|
| **NestJS** sobre Express | Estructura modular con DI nativa, Swagger integrado y soporte TypeScript de primera clase facilita el escalado y mantenimiento |
| **Prisma** como ORM | Type-safety en queries, migraciones con historial y modelo de datos declarativo en un solo schema |
| **JWT stateless** | Permite escalar horizontalmente sin sesiones compartidas; el rol viaja en el token para reducir queries por request |
| **RBAC con Guards** | JwtAuthGuard + RolesGuard + `@Roles()` decorator desacoplan la lógica de autorización de los controllers |
| **UTC en base de datos** | Los turnos se almacenan en UTC y se convierten al timezone del browser; evita bugs de horario de verano y facilita consultas globales |
| **React Context** para auth | Suficiente para la escala actual; el token se persiste en localStorage y se valida en cada request |

---

## Arquitectura

```mermaid
graph TD
    subgraph Client ["Cliente (Vercel)"]
        A[React 19 SPA]
        A --> B[AuthContext / JWT]
        A --> C[React Router v7]
    end

    subgraph Server ["Servidor (Render)"]
        D[NestJS API]
        D --> E[JwtAuthGuard]
        E --> F[RolesGuard]
        F --> G[Controllers]
        G --> H[Services]
        H --> I[PrismaService]
    end

    subgraph Database ["Base de Datos (Supabase)"]
        I --> J[(PostgreSQL 16)]
    end

    A -->|"HTTP + Bearer Token"| D
```

---

## Modelo de datos

```mermaid
erDiagram
    User {
        uuid id PK
        string name
        string email
        string role "CLIENT | ADMIN | EMPLOYEE"
        uuid businessId FK
    }

    Business {
        uuid id PK
        string name
        uuid ownerId FK
    }

    Service {
        uuid id PK
        string name
        float price
        int durationMin
        uuid businessId FK
    }

    Schedule {
        uuid id PK
        int dayOfWeek "0-6"
        string from "HH:mm"
        string to "HH:mm"
        uuid businessId FK
    }

    Booking {
        uuid id PK
        datetime date
        datetime endTime
        string status "PENDING|CONFIRMED|COMPLETED|CANCELLED"
        string paymentStatus
        float finalPrice
        uuid userId FK
        uuid serviceId FK
        uuid businessId FK
        uuid employeeId FK
    }

    User ||--o{ Business : "owns (ADMIN)"
    Business ||--o{ Service : "has"
    Business ||--o{ Schedule : "has"
    Business ||--o{ Booking : "receives"
    User ||--o{ Booking : "creates (CLIENT)"
    User ||--o{ Booking : "assigned (EMPLOYEE)"
    Service ||--o{ Booking : "booked as"
```

---

## API Overview

| Módulo | Método | Ruta | Roles |
|--------|--------|------|-------|
| **Auth** | POST | `/auth/register` | — |
| | POST | `/auth/login` | — |
| **Users** | GET | `/users/me` | Autenticado |
| | PUT | `/users/:id` | Autenticado |
| **Business** | GET/POST | `/business` | ADMIN |
| | GET | `/business/public` | — |
| | GET/PUT/DELETE | `/business/:id` | ADMIN |
| **Services** | GET/POST | `/services` | ADMIN, CLIENT |
| | GET/PUT/DELETE | `/services/:id` | ADMIN |
| **Schedules** | GET/POST | `/schedules` | ADMIN |
| | GET/PUT/DELETE | `/schedules/:id` | ADMIN |
| **Bookings** | GET/POST | `/bookings` | ADMIN, CLIENT |
| | GET | `/bookings/my-bookings` | CLIENT |
| | GET | `/bookings/my-assignments` | EMPLOYEE |
| | GET | `/bookings/available-employees` | Autenticado |
| | PATCH | `/bookings/:id/status` | ADMIN, EMPLOYEE |
| **Admin** | GET | `/admin/dashboard` | ADMIN |
| | GET | `/admin/metrics` | ADMIN |
| | GET/POST/PUT/DELETE | `/admin/employee` | ADMIN |

> Documentación completa: `http://localhost:3000/api` (Swagger)

---

## Setup local

### Requisitos previos

- Node.js v18+
- Docker (recomendado) o PostgreSQL 16+ instalado localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management
```

### 2. Configurar variables de entorno

```bash
# Backend
cd server
cp .env.example .env

# Frontend
cd ../client
cp .env.example .env
```

### 3. Instalar dependencias

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 4. Base de datos

**Opción A — Docker (recomendado)**

```bash
# Desde la raíz del proyecto
docker-compose -f .devcontainer/docker-compose.yml up -d
```

**Opción B — PostgreSQL local**

Asegurarse de que PostgreSQL 16 esté corriendo y actualizar `DATABASE_URL` en `server/.env`.

### 5. Migraciones y datos de prueba

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### 6. Correr el proyecto

```bash
# Backend — http://localhost:3000
# Swagger  — http://localhost:3000/api
cd server && npm run start:dev

# Frontend — http://localhost:5173
cd client && npm run dev
```

---

## Variables de entorno

### Backend (`server/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL (pooling) | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | URL directa PostgreSQL (migraciones) | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Clave secreta para firmar JWT | `un-secreto-seguro` |
| `JWT_EXPIRATION_TIME` | Tiempo de expiración del token | `1d` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `ALLOWED_ORIGINS` | Orígenes permitidos (CORS) | `http://localhost:5173` |

### Frontend (`client/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

---

## Testing

```bash
cd server

# Correr todos los tests
npm run test

# Modo watch
npm run test:watch

# Reporte de cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

Los tests cubren servicios y controladores de todos los módulos usando Jest con mocks de Prisma.

---

## Seguridad

El proyecto pasó por una auditoría completa resolviendo **24 issues** en 4 niveles de severidad:

- **5 Críticos** — Endpoints sin autenticación, CORS abierto, validación de JWT_SECRET, protección del seed en producción
- **6 Altos** — Queries N+1, serialización de BigInt, expiración de JWT, propagación de errores
- **8 Medios** — Passwords expuestos en respuestas, providers duplicados, side effects en JSX
- **5 Bajos** — Tests unitarios, dependencias sin uso, imports absolutos

Todos los issues fueron trackeados vía GitHub Issues → PR → merge a main.

---

## Deployment

| Servicio | Plataforma | Configuración |
|----------|-----------|---------------|
| **Frontend** | [Vercel](https://vercel.com) | Root: `client/`, build: `npm run build` |
| **Backend** | [Render](https://render.com) | Root: `server/`, start: `npm run start:prod` |
| **Base de datos** | [Supabase](https://supabase.com) | PostgreSQL 16 con connection pooling |

---

## Roadmap

- [ ] Timezone configurable por negocio (actualmente usa timezone del browser)
- [ ] Notificaciones por email al crear/cancelar turno
- [ ] Login con Google / Apple (estrategias Passport ya implementadas, pendiente integración)
- [ ] Integración de pagos online
- [ ] Módulo de caja completo (CashRegister, movimientos y cierres de caja)
- [ ] Rate limiting en la API

---

## Autor

**Nahuel Argañaraz**

- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

<div align="center">

_Si el proyecto te resulta útil, dejá una estrella_ ⭐

</div>
