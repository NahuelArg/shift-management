# Shift Management

A full-stack appointment management system built with React, NestJS, and Prisma. Businesses can manage services, schedules, employees, and bookings through a role-based dashboard.

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-19.x-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)

## 🌐 Live Demo

**[https://shift-management-livid.vercel.app](https://shift-management-livid.vercel.app)**

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin1@test.com        | password123 |
| Client   | client1@test.com       | password123 |
| Employee | employee1@test.com     | password123 |

## 🚀 Features

- **Authentication** — JWT-based auth with role-based access control (Admin / Employee / Client)
- **Admin Dashboard** — Business metrics, employee management, schedule configuration
- **Booking System** — Availability checking, conflict detection, automatic employee assignment
- **REST API** — Fully documented with Swagger at `/api`

## 🛡️ Security & Code Quality

This project went through a full security and quality audit resolving **24 issues** across 4 severity levels:

- 🔴 **5 Critical** — Unauthenticated endpoints, open CORS, JWT secret validation, seed protection
- 🟠 **6 High** — N+1 queries, BigInt serialization, JWT expiration check, error propagation
- 🟡 **8 Medium** — Password exposure in responses, duplicate providers, JSX side effects
- 🟢 **5 Low** — Unit tests with Jest, unused dependencies, absolute imports

All issues tracked and resolved via GitHub Issues → PR → merge to main.

## 🛠️ Tech Stack

### Frontend
- React 19 · TypeScript · Vite · Tailwind CSS · React Router v7

### Backend
- NestJS · Prisma ORM · PostgreSQL · JWT · Swagger/OpenAPI · Jest

## 📋 Prerequisites

- Node.js v18+
- npm
- PostgreSQL 16+

## 🔧 Installation

```bash
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management
```

```bash
# Backend
cd server
npm install
cp .env.example .env   # configure DATABASE_URL and JWT_SECRET

# Frontend
cd ../client
npm install
cp .env.example .env   # configure VITE_API_URL
```

```bash
# Run migrations and seed
cd server
npx prisma migrate dev
npx prisma db seed
```

## 🚀 Running

```bash
# Backend (server/)
npm run start:dev      # http://localhost:3000
                       # Swagger: http://localhost:3000/api

# Frontend (client/)
npm run dev            # http://localhost:5173
```

## 🔒 Environment Variables

### Backend (`server/.env`)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/shift_management"
DIRECT_URL="postgresql://user:password@localhost:5432/shift_management"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION_TIME=1d
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (`client/.env`)
```bash
VITE_API_URL=http://localhost:3000
```

## 🚢 Deployment

| Service  | Platform                                      |
|----------|-----------------------------------------------|
| Frontend | [Vercel](https://vercel.com) — root: `client` |
| Backend  | [Render](https://render.com) — root: `server` |
| Database | [Supabase](https://supabase.com) — PostgreSQL |

## 🎯 Roadmap

- [ ] Timezone per business (currently uses browser timezone)
- [ ] Email notifications for bookings
- [ ] Google / Apple OAuth login
- [ ] Online payment integration
- [ ] BookingsService unit tests + integration tests

## 👤 Author

**Nahuel Argañaraz**
- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

⭐ If you find this project useful, please give it a star!
