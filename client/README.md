# Shift Management - Frontend

Modern React application for managing business appointments, employees, and schedules.

## 🚀 Tech Stack

- **React 19.1.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router DOM** - Navigation
- **Axios** - HTTP client
- **Context API** - State management

## 📋 Prerequisites

- Node.js v22.18 or higher
- npm or yarn

## 🔧 Installation

```bash
npm install
```

## 🌍 Environment Variables

Create a `.env` file in the client directory:

```bash
VITE_API_URL=http://localhost:3000
```

For production:
```bash
VITE_API_URL=https://your-backend-api.com
```

## 🚀 Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── navBar.tsx
│   ├── privateRoute.tsx
│   └── bookingManagement/
├── context/            # React Context providers
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── admin.tsx       # Admin dashboard
│   ├── users.tsx       # Employee management
│   ├── business.tsx    # Business management
│   ├── services.tsx    # Service management
│   ├── schedules.tsx   # Schedule management
│   ├── bookings.tsx    # Booking management
│   ├── dashboard.tsx   # Client dashboard
│   ├── home.tsx        # Landing page
│   ├── login.tsx       # Login page
│   └── register.tsx    # Registration page
├── services/           # API service layer
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── businessService.ts
│   ├── scheduleService.ts
│   ├── serviceService.ts
│   └── userService.ts
└── App.tsx            # Main app component
```

## 🔐 Available Routes

### Public Routes
- `/` - Redirects to home
- `/home` - Landing page
- `/login` - User login
- `/register` - User registration

### Client Routes (Authenticated)
- `/dashboard` - Client dashboard
- `/bookings` - Manage bookings

### Admin Routes (ADMIN role required)
- `/dashboard/admin` - Admin dashboard with metrics
- `/users` - Employee management
- `/business` - Business management
- `/services` - Service management
- `/schedules` - Schedule management

## 🎨 Key Features

- **Role-based routing** with PrivateRoute component
- **JWT authentication** via Context API
- **Responsive design** with Tailwind CSS
- **Type-safe** API calls with TypeScript interfaces
- **Real-time validation** using NestJS DTOs on backend

## 📦 Main Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.1.1",
  "axios": "^1.7.9",
  "tailwindcss": "^3.4.17"
}
```

## 🔨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
3. Deploy automatically on push to main branch

### Manual Build

```bash
npm run build
# Upload 'dist' folder to your hosting provider
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - see root [LICENSE](../LICENSE) file

## 👤 Author

Nahuel Argañaraz
- GitHub: [@NahuelArg](https://github.com/NahuelArg)
- LinkedIn: [Nahuel Argañaraz](https://www.linkedin.com/in/nahuel-arga%C3%B1araz/)
