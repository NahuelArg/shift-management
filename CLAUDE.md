# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A booking/appointment management system ("Gestor de turnos") with a NestJS backend and React frontend. Businesses can manage services, schedules, employees, and bookings. Includes a cash register module for payment tracking.

## Repository Structure

```
/
├── server/   # NestJS API (TypeScript, Prisma ORM, PostgreSQL)
└── client/   # React SPA (TypeScript, Vite, Tailwind CSS)
```

## Commands

### Server (run from `server/`)

```bash
npm run start:dev       # Start in watch mode (development)
npm run build           # Build for production
npm run start:prod      # Run production build
npm run lint            # Lint and auto-fix
npm run format          # Format with Prettier
npm test                # Run unit tests (Jest)
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run test:e2e        # Run end-to-end tests
```

### Client (run from `client/`)

```bash
npm run dev             # Start Vite dev server on port 5173
npm run build           # TypeScript check + Vite build
npm run lint            # ESLint
npm run preview         # Preview production build
```

### Database (run from `server/`)

```bash
npx prisma migrate dev          # Apply migrations in development
npx prisma migrate deploy       # Apply migrations in production
npx prisma generate             # Regenerate Prisma client after schema changes
npx prisma studio               # Open Prisma Studio GUI
npx prisma db seed              # Seed the database (ts-node prisma/seed.ts)
```

## Server Architecture

### Module Structure

Each domain is a NestJS module under `server/src/`:
- `auth/` — JWT authentication, Google/Apple OAuth strategies, register/login
- `users/` — User CRUD (CLIENT role)
- `admin/` — Admin-specific operations: dashboard, metrics, employee management
- `business/` — Business entity management
- `services/` — Services offered by a business
- `schedules/` — Business operating hours (day-of-week + time ranges)
- `bookings/` — Appointment bookings with status/payment tracking

Shared infrastructure:
- `prisma/` (at root of `server/`) — `PrismaService` (extends `PrismaClient`) and `PrismaModule`
- `guard/` — `JwtAuthGuard`, `RolesGuard`, `OwnershipGuard`
- `decorator/` — `@Roles()` decorator
- `strategies/` — Passport strategies: `jwt`, `google`, `apple`
- `types/` — `RequestWithUser` interface (extends Express Request with typed `user`)
- `utils/` — `convertBigIntToString` helper

### Auth & Authorization

- JWT tokens are signed with `JWT_SECRET`, expire in `1d`
- Three roles: `CLIENT`, `ADMIN`, `EMPLOYEE`
- Guards applied via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`
- JWT payload shape: `{ userId, email, role }` (see `jwt-payload.interface.ts`)
- Auth providers: `LOCAL`, `GOOGLE`, `APPLE`

### Data Model (Prisma)

Key entities and relationships:
- **User** — has a `role` (CLIENT/ADMIN/EMPLOYEE), optional `businessId` (employees belong to a business)
- **Business** — owned by a User (`ownerId`), has employees (Users), services, schedules, bookings, cash registers
- **Service** — belongs to a Business; has `durationMin` and `price`
- **Schedule** — business operating hours per `dayOfWeek` (0=Sunday, 6=Saturday); stores `from`/`to` as `"HH:MM"` strings
- **Booking** — links User, Service, Business, optional Employee; has `date` (DateTime), `endTime`, `status` (PENDING/CONFIRMED/COMPLETED/CANCELLED), `paymentStatus`, optional `paymentMethod`
- **CashRegister / CashMovement / CashClosing** — cash register lifecycle with movement types (OPENING, SALE, EXPENSE, WITHDRAWAL, DEPOSIT, CLOSING)

### API

- Swagger UI available at `http://localhost:3000/api`
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS is fully open (`origin: true`) — intended to be restricted via `ALLOWED_ORIGINS` env var

## Client Architecture

### Routing & Auth

- `App.tsx` defines all routes using React Router v7
- `PrivateRoute` component wraps protected routes with optional `requiredRole` prop
- `AuthContext` (`src/context/AuthContext.tsx`) stores `user` and `token` in `localStorage`; provides `login()` and `logout()`
- Use `useAuth()` hook to access auth state throughout the app

### API Communication

- `src/services/apiClient.ts` — Axios instance; reads `VITE_API_URL` env var (defaults to `http://localhost:3000`); auto-attaches `Authorization: Bearer <token>` from `localStorage`
- Each domain has a service file in `src/services/` (e.g., `bookingService.ts`, `businessService.ts`)

### Pages by Role

- `/home` — public landing
- `/login`, `/register` — auth pages
- `/dashboard` — CLIENT role
- `/dashboard/employee` — EMPLOYEE role
- `/dashboard/admin`, `/users`, `/business`, `/services`, `/schedules` — ADMIN role
- `/bookings` — authenticated (any role)

## Environment Variables

### Server (`server/.env`)

```
DATABASE_URL=         # PostgreSQL connection string (via pgBouncer for pooling)
DIRECT_URL=           # Direct PostgreSQL URL (used for Prisma migrations)
JWT_SECRET=
JWT_EXPIRATION_TIME=1d
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_ORIGINS=http://localhost:5173
```

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:3000
```

## Key Conventions

- All Prisma queries go through `PrismaService` injected into service classes — never use Prisma directly in controllers
- BigInt values from Prisma must be converted using `convertBigIntToString` before returning from controllers
- Service files use `date-fns` and `date-fns-tz` for date manipulation; `Booking.date` is stored as `DateTime` in UTC
- DTOs use `class-validator` decorators for validation; all DTOs live in a `dto/` or `DTO/` subfolder inside each module
