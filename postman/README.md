# Postman — Gestor de Turnos

E2E test collection for the NestJS backend. 48 requests organized in 10 folders that simulate a full business lifecycle: admin login, business creation, services, schedules, employees, client bookings, status transitions and cleanup.

## Files

- `gestor-de-turnos.postman_collection.json` — Collection (v2.1)
- `gestor-de-turnos.postman_environment.json` — Environment with `base_url`, admin credentials

## Prerequisites (pre-requisitos)

1. **Backend running** on `http://localhost:3000` — `cd server && npm run start:dev`
2. **Database seeded** — `cd server && npx prisma db seed`
   - Seeds admin `admin1@test.com` / `password123` (required for folder 1)

## Import (importar)

In Postman:
1. `File` → `Import` → drop both `.json` files.
2. Top-right env dropdown → select **Gestor de Turnos — Local**.

## Run the full e2e flow (correr el flujo completo)

Click the collection name → `Run collection` → `Run Gestor de Turnos — E2E`.

The runner executes in order and automatically:
- Saves `{{adminToken}}`, `{{clientToken}}`, `{{employeeToken}}` after each login.
- Captures `{{businessId}}`, `{{serviceId}}`, `{{scheduleId}}`, `{{bookingId}}` from create responses.
- Computes `{{bookingDateISO}}` dynamically (next Monday 10:00) so the booking always falls inside the schedule.

## Folder order (orden)

| # | Folder | Purpose |
|---|--------|---------|
| 1 | 🔐 Auth | Login admin (seed) + register/login client. |
| 2 | 👑 Admin — Self & Metrics | `/admin/me`, dashboard, metrics. |
| 3 | 🏢 Business | Create/list/update/get the test business. |
| 4 | 💇 Services | CRUD on services. |
| 5 | 🗓️ Schedules | Business operating hours (Mon & Tue). |
| 6 | 👥 Admin — Employees | Create employee + login as employee. |
| 7 | 👤 Users (admin CRUD) | Admin CRUD over users. |
| 8 | 📅 Bookings (e2e) | CLIENT creates → ADMIN confirms → EMPLOYEE completes. |
| 9 | ❌ Edge cases & Security | 401 / 403 / 400 cases. |
| 10 | 🧹 Cleanup | Deletes everything the run created. |

## Tips (consejos)

- **Cada corrida crea emails únicos** (`client_e2e_<timestamp>@test.com`) para evitar colisiones con corridas previas.
- **Skip cleanup** si querés inspeccionar los datos en Prisma Studio (`npx prisma studio`).
- **Failures**: si algo falla a mitad de carrera, revisá la pestaña `Console` de Postman (View → Show Postman Console) — imprime el status de cada request.
- **Módulo CashRegister**: el schema Prisma ya lo define pero aún no hay controller. Cuando lo implementes, extendé esta colección con un folder adicional.
