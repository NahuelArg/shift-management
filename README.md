# Appointment Manager

A modern, full-stack appointment management system built with React, NestJS, and Prisma. This application allows businesses to manage their appointments, employees, and client bookings efficiently.

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)

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
- PostgreSQL
- JWT Authentication
- REST API

## 📋 Prerequisites

- Node.js (v22.18 or higher)
- npm or yarn
- PostgreSQL database
- Git

## 🔧 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/appointment-manager.git
cd appointment-manager
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
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:3000"
```

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

Your Name
- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)

---

⭐️ If you find this project useful, please consider giving it a star!
