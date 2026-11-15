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
npm run lint:check      # Lint without fixing (used by CI)
npm run format          # Format with Prettier
npm run format:check    # Check formatting (used by CI)
npm test                # Run unit tests (Jest, Prisma mocked)
npm run test:cov        # Run tests with coverage
npm run test:e2e        # E2E tests against a real PostgreSQL (needs DATABASE_URL + seed)
```

### Client (run from `client/`)

```bash
npm run dev             # Start Vite dev server on port 5173
npm run build           # TypeScript check + Vite build
npm run lint            # ESLint (0 errors expected; CI fails on errors)
npm run preview         # Preview production build
```

### Database (run from `server/`)

```bash
npx prisma migrate dev          # Create/apply migrations in development
npx prisma migrate deploy       # Apply migrations (runs automatically on container start)
npx prisma generate             # Regenerate Prisma client after schema changes
npx prisma studio               # Open Prisma Studio GUI
npx prisma db seed              # Seed demo data — WIPES ALL TABLES first, never run against production
```

### CI

`.github/workflows/ci.yml` runs on every PR and push to `main`:
- **Backend**: migrations + schema drift check, `format:check`, `lint:check`, unit tests, build, seed + e2e on a PostgreSQL 16 service container.
- **Frontend**: lint and build (typecheck).

## Server Architecture

### Module Structure

Each domain is a NestJS module under `server/src/`:
- `auth/` — JWT authentication, register/login (LOCAL accounts only; there is no social login)
- `users/` — User CRUD scoped to the admin's businesses; client search for booking on behalf of clients
- `admin/` — Admin-specific operations: own profile, dashboard, metrics, employee management
- `business/` — Business entity management (each business has an IANA `timezone`)
- `services/` — Services offered by a business (soft delete via `active`)
- `schedules/` — Business operating hours (day-of-week + time ranges)
- `bookings/` — Appointment bookings with status/payment tracking
- `health/` — `GET /health` (liveness) and `GET /health/db` (readiness, keeps Render/Supabase awake)

Shared infrastructure:
- `prisma/` (at root of `server/`) — `PrismaService` (extends `PrismaClient`, **omits `User.password` globally**) and `PrismaModule` (`@Global`: never add `PrismaService` to a module's `providers`, it would create another connection pool)
- `src/app.setup.ts` — `configureApp()`: trust proxy, helmet, CORS, ValidationPipe. Used by `main.ts` and e2e tests
- `src/common/` — `DecimalToNumberInterceptor` (global): converts `Prisma.Decimal` to `number` in responses
- `guard/` — `JwtAuthGuard`, `RolesGuard`
- `decorators/` — `@Roles()`, `@NormalizeEmail()` (trim + lowercase, use it on every email DTO field)
- `strategies/` — Passport `jwt` strategy (reloads the user on every request)
- `types/` — `RequestWithUser` interface (extends Express Request with typed `user`)
- `utils/` — `convertBigIntToString`, `toMinutes`

### Auth & Authorization

- JWT tokens are signed with `JWT_SECRET` (HS256), expire in `1d`
- `JwtStrategy.validate` loads the user from the DB on each request: deleted users get 401 and role changes apply immediately
- Three roles: `CLIENT`, `ADMIN`, `EMPLOYEE`
- Guards applied via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`
- **Roles are not enough: every query must be scoped to the caller.** `ADMIN` only touches businesses where `ownerId = req.user.userId`; `EMPLOYEE` only their `businessId`; `CLIENT` only their own bookings. Always take the user id from `req.user`, never from the body/query
- Login returns the same generic 401 for unknown email and wrong password (no user enumeration); `/auth/login` is limited to 10 req/min and `/auth/register` to 5 req/min per IP
- JWT payload shape: `{ userId, email, role }` (see `jwt-payload.interface.ts`)

### Data Model (Prisma)

Key entities and relationships:
- **User** — has a `role` (CLIENT/ADMIN/EMPLOYEE), optional `businessId` (employees belong to a business)
- **Business** — owned by a User (`ownerId`), has `timezone` (IANA, default `Europe/Madrid`), employees, services, schedules, bookings, cash registers
- **Service** — belongs to a Business; has `durationMin`, `price` (`Decimal`) and `active` (soft delete; inactive services are hidden and cannot be booked)
- **Schedule** — business operating hours per `dayOfWeek` (0=Sunday, 6=Saturday); `from`/`to` as `"HH:MM"` strings
- **Booking** — links User (nullable = walk-in), Service, Business, optional Employee; `date`/`endTime` in UTC, `timezone` copied from the business, `finalPrice` (`Decimal`), `status` (PENDING/CONFIRMED/COMPLETED/CANCELLED), `paymentStatus`, optional `paymentMethod`
- **CashRegister / CashMovement / CashClosing** — schema only (no code yet); cash register lifecycle with movement types (OPENING, SALE, EXPENSE, WITHDRAWAL, DEPOSIT, CLOSING)
- Money is `Decimal @db.Decimal(12, 2)`; sum with `Prisma.Decimal` (`.plus()`), never with JS numbers
- Deleting a client keeps their bookings (`userId` set to null); a service with bookings cannot be hard-deleted (use soft delete)
- All public tables have Row Level Security enabled (blocks Supabase's public Data API; Prisma connects as `postgres`, which bypasses RLS)

### Bookings rules

- `POST /bookings`: price comes from the service, opening hours are checked in the business timezone, the service must belong to the business, past dates are rejected. `finalPrice`/`timezone` in the body are accepted but ignored
- Creation runs in a transaction with `pg_advisory_xact_lock(hashtext(businessId))` to prevent double booking under concurrency
- Status changes only through `PATCH /bookings/:id/status` (`BookingsService.changeStatus`): ADMIN (own businesses) and EMPLOYEE (assigned bookings) any status; CLIENT can only cancel their own PENDING/CONFIRMED bookings
- `PUT /bookings/:id` (ADMIN of the business): reassign employee (conflict-checked) or adjust price

### API

- Swagger UI at `http://localhost:3000/api` — disabled when `NODE_ENV=production` unless `SWAGGER_ENABLED=true`
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. `@Body()` must be a DTO class: intersection types (`Dto & {...}`) emit `Object` metadata and silently disable validation
- CORS restricted to `ALLOWED_ORIGINS` (comma-separated)
- `trust proxy` = `TRUST_PROXY_HOPS` (default 1) so rate limiting sees the real client IP behind Render's proxy

## Client Architecture

### Routing & Auth

- `App.tsx` defines all routes using React Router v7
- `PrivateRoute` wraps protected routes; `requiredRole` accepts a role or a list of roles
- `AuthContext` (`src/context/AuthContext.tsx`) reads the session from `localStorage` synchronously (lazy initial state) so reloading a protected page does not bounce to `/login`; provides `login()` and `logout()`
- Use `useAuth()` hook to access auth state throughout the app

### API Communication

- `src/services/apiClient.ts` — Axios instance; reads `VITE_API_URL` (defaults to `http://localhost:3000`); attaches `Authorization: Bearer <token>`; on a 401 outside `/auth/*` clears the session and redirects to `/login?expired=1`. Always use it instead of raw `axios`
- `src/services/apiError.ts` — `getErrorMessage(err, fallback)` for typed error messages (no `catch (err: any)`)
- `src/services/adminBusinessCache.ts` — in-memory cache of `/admin/me` businesses; invalidated on business changes and logout
- Each domain has a service file in `src/services/` (e.g., `bookingService.ts`, `businessService.ts`)

### UI conventions

- Design tokens live in `tailwind.config.js` (`index.css` reads them with `theme()`); colored text uses the `-text` tokens (`text-success-text`, not `text-success`) to meet WCAG AA contrast
- Mobile-first Tailwind; tables hide secondary columns below `md`/`lg` instead of scrolling horizontally
- Form fields are 16px on mobile (prevents iOS zoom)

### Pages by Role

- `/home` — public landing
- `/login`, `/register` — auth pages
- `/dashboard` — CLIENT role
- `/dashboard/employee` — EMPLOYEE role
- `/dashboard/admin`, `/users`, `/business`, `/services`, `/schedules` — ADMIN role
- `/calendar` — ADMIN and EMPLOYEE (employees see only their assignments)
- `/bookings` — authenticated (any role)

## Environment Variables

### Server (`server/.env`)

```
DATABASE_URL=         # PostgreSQL connection string (via pgBouncer for pooling)
DIRECT_URL=           # Direct PostgreSQL URL (used for Prisma migrations, required at container start)
JWT_SECRET=
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
SWAGGER_ENABLED=      # optional, enables /api in production
TRUST_PROXY_HOPS=1    # optional, proxies in front of the app
```

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:3000
VITE_DEMO_MODE=false  # shows demo accounts on the login page
```

Security headers (CSP, X-Frame-Options, HSTS...) are defined in `client/vercel.json` and mirrored in `amplify.yml` — keep them in sync, and add new API origins to `connect-src`.

## Key Conventions

- All Prisma queries go through `PrismaService` injected into service classes — never use Prisma directly in controllers
- Authorization rules belong in the service layer (testable), with the actor (`{ userId, role }`) passed from `req.user`
- BigInt values from Prisma must be converted using `convertBigIntToString` before returning from controllers
- Service files use `date-fns` and `date-fns-tz` for date manipulation; `Booking.date` is stored as `DateTime` in UTC
- DTOs use `class-validator` decorators for validation; all DTOs live in a `dto/` or `DTO/` subfolder inside each module
