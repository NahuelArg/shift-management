# Shift Management

A modern, full-stack appointment management system built with React, NestJS, and Prisma. This application allows businesses to manage their appointments, employees, and client bookings efficiently.

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)

## 📚 Documentación Adicional

- **[📑 Índice de Documentación](./INDICE-DOCUMENTACION.md)** - Guía de navegación de toda la documentación disponible
- **[🏗️ Análisis Arquitectónico Completo](./ANALISIS-ARQUITECTURA.md)** - Análisis detallado de arquitectura, problemas, mejoras y plan de migración (en Español)
- **[⚡ Guía de Validación Rápida](./VALIDACION-RAPIDA.md)** - Comandos esenciales para validación y troubleshooting
- **[📊 Resumen de Entregables](./RESUMEN-ENTREGABLES.md)** - Resumen ejecutivo del análisis realizado

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/Employee/Client)
  - Secure registration and login system

- **Admin Dashboard**
  - Employee management
  - Business metrics and analytics
  - Appointment oversight
  - Schedule management

- **Booking System**
  - Interactive appointment scheduling
  - Real-time availability checking
  - Appointment status tracking
  - Automatic end time calculation

- **Modern UI/UX**
  - Responsive design
  - Tailwind CSS styling
  - Mobile-friendly interface
  - Intuitive navigation

## 🛠️ Tech Stack

### Frontend
- React 19.1.1
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Context API for state management

### Backend
- NestJS
- Prisma ORM
- PostgreSQL (MySQL also supported)
- JWT Authentication
- REST API
- Swagger/OpenAPI Documentation

## 📋 Prerequisites

- Node.js (v22.18 or higher)
- npm or yarn
- PostgreSQL 16+ (or MySQL 8+)
- Git

## 🔧 Installation

1. Clone the repository
```bash
git clone https://github.com/NahuelArg/shift-management.git
cd shift-management
```

2. Install dependencies for both frontend and backend
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Set up environment variables
```bash
# In the server directory
cp .env.example .env
# Configure your database and JWT settings in .env

# In the client directory
cp .env.example .env
# Configure your API URL and other frontend settings
```

4. Set up the database
```bash
# In the server directory
npx prisma migrate dev
```

## 🚀 Running the Application

### Development Mode

1. Start the backend server
```bash
# In the server directory
npm run start:dev
```

2. Start the frontend development server
```bash
# In the client directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api

## 📝 API Documentation

API documentation is available through Swagger UI at `/api` when running the backend server.

## 🔒 Environment Variables

### Backend (.env)
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

### Frontend (.env)
```bash
# Development
VITE_API_URL=http://localhost:3000

# Production
# VITE_API_URL=https://your-backend-api.com
```

## 🚢 Deployment

### Frontend (Vercel - Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend-url.com`
5. Deploy

### Backend (Render - Recommended)

1. Push your code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Configure service:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
4. Add environment variables:
   - `DATABASE_URL` (from Render PostgreSQL or external DB)
   - `JWT_SECRET`
   - `PORT=3000`
   - `NODE_ENV=production`
5. Deploy

### Database

**Option 1: Supabase (Recommended)**
- Free PostgreSQL database
- Automatic backups
- Connection pooling

**Option 2: Render PostgreSQL**
- Integrated with Render services
- Easy setup

## 🎯 Future Features

- [ ] Email notifications for appointments
- [ ] Service categories and pricing
- [ ] Online payment integration
- [ ] Multiple business locations
- [ ] Calendar integration
- [ ] Mobile app version

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Nahuel Argañaraz
- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

⭐️ If you find this project useful, please consider giving it a star!
