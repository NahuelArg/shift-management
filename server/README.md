# Shift Management - Backend API

A robust and modular appointment management system built with NestJS, supporting authentication, role-based access control, complex CRUD operations, admin dashboard, and comprehensive API documentation.

---

## 🚀 Features

- **User Authentication & Authorization:** Secure JWT-based authentication with role-based access control
- **Multi-Role System:** Supports `ADMIN`, `EMPLOYEE`, and `CLIENT` roles with granular permissions
- **Appointment Booking:** Complete booking system with conflict detection and business hours validation
- **Admin Dashboard:** Comprehensive metrics, employee management, and business analytics
- **Service Management:** CRUD operations for business services with duration and pricing
- **Schedule Management:** Business hours and availability configuration
- **API Documentation:** Interactive Swagger/OpenAPI documentation at `/api`
- **Data Validation:** Robust validation using class-validator and DTOs
- **Database Agnostic:** Works with PostgreSQL (recommended) or MySQL

---

## 🛠️ Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database (MySQL also supported)
- **JWT** - Authentication tokens
- **Swagger/OpenAPI** - API documentation
- **class-validator** - DTO validation
- **bcrypt** - Password hashing

---

## 📋 Prerequisites

- Node.js v22.18 or higher
- npm or yarn
- PostgreSQL 16+ (or MySQL 8+)
- Git

---

## 🔧 Installation

```bash
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management/server
npm install
```

---

## 🌍 Environment Variables

Create a `.env` file in the server directory:

```bash
# Database - PostgreSQL (Recommended)
DATABASE_URL="postgresql://user:password@localhost:5432/shift_management"

# Or MySQL
# DATABASE_URL="mysql://user:password@localhost:3306/shift_management"

# JWT Secret (use a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development

# CORS (optional, defaults to allow all in development)
# ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

**Production Variables:**
```bash
DATABASE_URL="postgresql://user:password@production-host:5432/shift_management"
JWT_SECRET="production-secret-key"
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## 💾 Database Setup

### Option 1: Using Docker Compose (Recommended for Development)

```bash
# Start PostgreSQL container
docker-compose -f .devcontainer/docker-compose.yml up -d db

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database with test data
npx prisma db seed
```

### Option 2: Using Local PostgreSQL

```bash
# Create database
createdb shift_management

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### Option 3: Using MySQL

Update your `.env` to use MySQL connection string, then:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE shift_management"

# Run migrations
npx prisma migrate dev
```

---

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Production Mode

```bash
npm run build
npm run start:prod
```

---

## 📚 API Documentation

Interactive Swagger UI is available at:
**`http://localhost:3000/api`**

---

## 🗂️ Project Structure

```
src/
├── admin/              # Admin management module
│   ├── DTO/           # Data Transfer Objects
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── admin.module.ts
├── auth/              # Authentication module
│   ├── dto/
│   ├── strategies/    # Passport JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── bookings/          # Booking management
│   ├── dto/
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
├── business/          # Business CRUD
│   ├── dto/
│   ├── business.controller.ts
│   ├── business.service.ts
│   └── business.module.ts
├── schedules/         # Business schedules
│   ├── dto/
│   ├── schedules.controller.ts
│   ├── schedules.service.ts
│   └── schedules.module.ts
├── services/          # Service management
│   ├── dto/
│   ├── services.controller.ts
│   ├── services.service.ts
│   └── services.module.ts
├── users/             # User management
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── guard/             # Auth & role guards
├── decorator/         # Custom decorators
├── types/             # TypeScript interfaces
└── main.ts           # Application entry point
```

---

## 🔐 Main Endpoints

### Authentication
| Method | Endpoint          | Description              | Auth Required |
|--------|-------------------|--------------------------|---------------|
| POST   | `/auth/register`  | Register new user        | No            |
| POST   | `/auth/login`     | Login and receive JWT    | No            |

### Users
| Method | Endpoint          | Description              | Roles         |
|--------|-------------------|--------------------------|---------------|
| GET    | `/users/me`       | Get current user profile | Authenticated |
| PUT    | `/users/:id`      | Update user profile      | Authenticated |

### Admin
| Method | Endpoint                              | Description                  | Roles |
|--------|---------------------------------------|------------------------------|-------|
| GET    | `/admin/me`                           | Get admin with businesses    | ADMIN |
| GET    | `/admin/dashboard`                    | Get dashboard metrics        | ADMIN |
| GET    | `/admin/metrics`                      | Get business metrics         | ADMIN |
| GET    | `/admin/employees`                    | Get all employees            | ADMIN |
| POST   | `/admin/employee`                     | Create employee              | ADMIN |
| PUT    | `/admin/employee/:id`                 | Update employee              | ADMIN |
| DELETE | `/admin/employee/:id`                 | Delete employee              | ADMIN |
| GET    | `/admin/business/:businessId/employees` | Get employees by business | ADMIN |

### Business
| Method | Endpoint           | Description              | Roles |
|--------|--------------------|--------------------------|-------|
| GET    | `/business`        | Get all businesses       | ADMIN |
| GET    | `/business/:id`    | Get business by ID       | ADMIN |
| POST   | `/business`        | Create business          | ADMIN |
| PUT    | `/business/:id`    | Update business          | ADMIN |
| DELETE | `/business/:id`    | Delete business          | ADMIN |

### Services
| Method | Endpoint          | Description              | Roles |
|--------|-------------------|--------------------------|-------|
| GET    | `/services`       | Get all services         | ADMIN |
| GET    | `/services/:id`   | Get service by ID        | ADMIN |
| POST   | `/services`       | Create service           | ADMIN |
| PUT    | `/services/:id`   | Update service           | ADMIN |
| DELETE | `/services/:id`   | Delete service           | ADMIN |

### Schedules
| Method | Endpoint            | Description              | Roles |
|--------|---------------------|--------------------------|-------|
| GET    | `/schedules`        | Get all schedules        | ADMIN |
| GET    | `/schedules/:id`    | Get schedule by ID       | ADMIN |
| POST   | `/schedules`        | Create schedule          | ADMIN |
| PUT    | `/schedules/:id`    | Update schedule          | ADMIN |
| DELETE | `/schedules/:id`    | Delete schedule          | ADMIN |

### Bookings
| Method | Endpoint                      | Description              | Roles         |
|--------|-------------------------------|--------------------------|---------------|
| GET    | `/bookings`                   | Get all bookings         | Authenticated |
| GET    | `/bookings/:id`               | Get booking by ID        | Authenticated |
| POST   | `/bookings`                   | Create booking           | CLIENT        |
| PATCH  | `/bookings/:id/status`        | Update booking status    | ADMIN/EMPLOYEE|
| DELETE | `/bookings/:id`               | Delete booking           | ADMIN         |

> **Note:** For complete request/response schemas, see the Swagger documentation at `/api`

---

## 🔒 Roles & Permissions

### ADMIN
- Full access to all resources
- Manage businesses, employees, services, schedules
- View analytics and metrics
- Approve/reject bookings

### EMPLOYEE
- View assigned bookings
- Update booking status
- Limited access to business data

### CLIENT
- Create bookings
- View own bookings
- Update own profile

---

## 🚢 Deployment

### 1. Build the Project

```bash
npm run build
```

### 2. Set Production Environment Variables

Ensure all environment variables are set correctly in your hosting platform (Render, Heroku, Railway, etc.)

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Start Production Server

```bash
npm run start:prod
```

### Recommended Platforms
- **Backend:** [Render](https://render.com), Railway, Heroku
- **Database:** Supabase, Railway, Render PostgreSQL

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 👤 Author

**Nahuel Argañaraz**
- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the author.

---

⭐️ If you find this project useful, please consider giving it a star!
