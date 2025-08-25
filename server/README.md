# Appointment Manager API

A robust and modular appointment management system built with NestJS, supporting authentication, role-based access, complex CRUD operations, admin dashboard, and API documentation.

---

## Features

- **User Registration & Login:** Secure authentication using JWT.
- **Role Management:** Supports `admin` and `client` roles with access control.
- **Appointment Booking:** Clients can request appointments by date and time.
- **Admin Dashboard:** Admins can approve/cancel appointments and view metrics.
- **State Management:** Appointments have status transitions (pending, approved, cancelled).
- **API Documentation:** Swagger/OpenAPI available at `/api`.
- **Extensible:** Easily add notifications (e.g., email) and external authentication (e.g., Firebase Auth).

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL (or your preferred database, update `.env` accordingly)

### Installation

```bash
git clone https://github.com/your-username/appointment-manager.git
cd appointment-manager
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure your database and JWT secrets:

```bash
cp .env.example .env
```

### Database Setup

```bash
npx prisma migrate dev
```

### Running the Application

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## API Documentation

Swagger UI is available at:  
`http://localhost:3000/api`

---

## Main Endpoints

| Method | Endpoint                | Description                        | Roles         |
|--------|-------------------------|------------------------------------|--------------|
| POST   | `/auth/register`        | Register a new user                | Public       |
| POST   | `/auth/login`           | Login and receive JWT              | Public       |
| GET    | `/users/me`             | Get current user profile           | Authenticated|
| POST   | `/bookings`             | Create a new appointment           | Client       |
| GET    | `/bookings`             | List user appointments             | Authenticated|
| PATCH  | `/bookings/:id/status`  | Update appointment status          | Admin        |
| GET    | `/admin/dashboard`      | Get admin dashboard metrics        | Admin        |

> For full details, see the Swagger UI.

---

## Deployment

1. Set up your production environment variables.
2. Build the project:
    ```bash
    npm run build
    ```
3. Start the server:
    ```bash
    npm run start:prod
    ```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)

---

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com).