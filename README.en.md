<div align="center">

# Shift Management

**A full-stack appointment management system for businesses**

Bookings · Employees · Services · Analytics — all in one place

<p>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E.svg?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748.svg?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/deploy-Vercel-black.svg?logo=vercel" alt="Deploy Vercel" />
</p>

🇦🇷 [Versión en español](./README.md)

**[View live demo →](https://shift-management-livid.vercel.app)**

</div>

---

## Table of Contents

- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Technical Decisions](#technical-decisions)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [API Overview](#api-overview)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Live Demo

**[https://shift-management-livid.vercel.app](https://shift-management-livid.vercel.app)**

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin1@test.com        | password123 |
| Client   | client1@test.com       | password123 |
| Employee | employee1@test.com     | password123 |

---

## Screenshots

> _Replace with actual screenshots from the production app_

| Admin Dashboard | Booking Management | Employee View |
|:-:|:-:|:-:|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## Features

- **JWT Authentication** — Secure login with role-based access control (Admin / Employee / Client)
- **Booking System** — Conflict detection, automatic employee assignment, and timezone support
- **Admin Dashboard** — Business metrics by period (day/month/year), employee management, and schedule configuration
- **Employee Panel** — View assigned bookings and update their status
- **Client Panel** — Create and track personal bookings
- **Documented REST API** — Swagger/OpenAPI at `/api` covering all endpoints
- **Multi-business** — An admin can manage multiple businesses with independent services and schedules

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7 |
| **Backend** | NestJS 11, TypeScript, Passport JWT, class-validator |
| **ORM / DB** | Prisma 6, PostgreSQL 16 |
| **Auth** | JWT + bcrypt, Passport strategies (Google/Apple ready) |
| **Docs** | Swagger / OpenAPI |
| **Testing** | Jest 29, ts-jest, Supertest |
| **Deploy** | Vercel (frontend), Render (backend), Supabase (DB) |

---

## Technical Decisions

| Decision | Reason |
|----------|--------|
| **NestJS** over Express | Native DI, built-in Swagger, and first-class TypeScript support make it easier to scale and maintain a modular codebase |
| **Prisma** as ORM | Type-safe queries, migration history, and a declarative schema in a single file reduce runtime errors and ease onboarding |
| **Stateless JWT** | Horizontal scaling without shared sessions; the role travels in the token to avoid extra DB queries per request |
| **RBAC via Guards** | JwtAuthGuard + RolesGuard + `@Roles()` decorator decouple authorization logic from controllers, keeping them clean |
| **UTC in the database** | Bookings are stored in UTC and converted to the browser's timezone on retrieval — prevents DST bugs and simplifies global queries |
| **React Context** for auth | Right-sized for the current scale; token is persisted in localStorage and validated on every request |

---

## Architecture

```mermaid
graph TD
    subgraph Client ["Client (Vercel)"]
        A[React 19 SPA]
        A --> B[AuthContext / JWT]
        A --> C[React Router v7]
    end

    subgraph Server ["Server (Render)"]
        D[NestJS API]
        D --> E[JwtAuthGuard]
        E --> F[RolesGuard]
        F --> G[Controllers]
        G --> H[Services]
        H --> I[PrismaService]
    end

    subgraph Database ["Database (Supabase)"]
        I --> J[(PostgreSQL 16)]
    end

    A -->|"HTTP + Bearer Token"| D
```

---

## Data Model

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

| Module | Method | Route | Roles |
|--------|--------|-------|-------|
| **Auth** | POST | `/auth/register` | — |
| | POST | `/auth/login` | — |
| **Users** | GET | `/users/me` | Authenticated |
| | PUT | `/users/:id` | Authenticated |
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
| | GET | `/bookings/available-employees` | Authenticated |
| | PATCH | `/bookings/:id/status` | ADMIN, EMPLOYEE |
| **Admin** | GET | `/admin/dashboard` | ADMIN |
| | GET | `/admin/metrics` | ADMIN |
| | GET/POST/PUT/DELETE | `/admin/employee` | ADMIN |

> Full documentation available at `http://localhost:3000/api` (Swagger)

---

## Local Setup

### Prerequisites

- Node.js v18+
- Docker (recommended) or PostgreSQL 16+ installed locally

### 1. Clone the repository

```bash
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management
```

### 2. Configure environment variables

```bash
# Backend
cd server
cp .env.example .env

# Frontend
cd ../client
cp .env.example .env
```

### 3. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 4. Database

**Option A — Docker (recommended)**

```bash
# From the project root
docker-compose -f .devcontainer/docker-compose.yml up -d
```

**Option B — Local PostgreSQL**

Make sure PostgreSQL 16 is running and update `DATABASE_URL` in `server/.env`.

### 5. Migrations and seed data

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### 6. Run the project

```bash
# Backend — http://localhost:3000
# Swagger  — http://localhost:3000/api
cd server && npm run start:dev

# Frontend — http://localhost:5173
cd client && npm run dev
```

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL (pooling) | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | Direct PostgreSQL URL (migrations) | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `a-strong-secret` |
| `JWT_EXPIRATION_TIME` | Token expiration time | `1d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

### Frontend (`client/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL | `http://localhost:3000` |

---

## Testing

```bash
cd server

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

Tests cover services and controllers across all modules using Jest with Prisma mocks.

---

## Security

The project went through a full security and code quality audit resolving **24 issues** across 4 severity levels:

- **5 Critical** — Unauthenticated endpoints, open CORS, JWT secret validation, seed protection in production
- **6 High** — N+1 queries, BigInt serialization, JWT expiration checks, error propagation
- **8 Medium** — Passwords exposed in responses, duplicate providers, JSX side effects
- **5 Low** — Unit tests, unused dependencies, absolute imports

All issues were tracked via GitHub Issues → PR → merge to main.

---

## Deployment

| Service | Platform | Configuration |
|---------|----------|---------------|
| **Frontend** | [Vercel](https://vercel.com) | Root: `client/`, build: `npm run build` |
| **Backend** | [Render](https://render.com) | Root: `server/`, start: `npm run start:prod` |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL 16 with connection pooling |

---

## Roadmap

- [ ] Per-business timezone configuration (currently uses browser timezone)
- [ ] Email notifications on booking creation / cancellation
- [ ] Google / Apple OAuth login (Passport strategies already implemented, integration pending)
- [ ] Online payment integration
- [ ] Full cash register module (CashRegister, movements, and closings)
- [ ] API rate limiting

---

## Author

**Nahuel Argañaraz**

- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

<div align="center">

_If you find this project useful, please give it a star_ ⭐

</div>
