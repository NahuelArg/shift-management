# Frontend Testing Guide

Este documento describe todas las funcionalidades del frontend y cómo probarlas.

## Configuración Inicial

1. Asegúrate de que el servidor backend esté corriendo en `http://localhost:3000`
2. Instala las dependencias del cliente:
   ```bash
   cd client
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en `http://localhost:5173`

## Funcionalidades Implementadas

### 1. Autenticación (Auth)

#### Registro de Usuario
- **Ruta:** `/register`
- **Descripción:** Permite a los usuarios crear una cuenta nueva
- **Campos:**
  - Nombre
  - Email
  - Contraseña
  - Teléfono (opcional)
  - Rol (ADMIN, CLIENT, EMPLOYEE)
- **Endpoint:** `POST /auth/register`

#### Login
- **Ruta:** `/login`
- **Descripción:** Permite a los usuarios iniciar sesión
- **Campos:**
  - Email
  - Contraseña
- **Endpoint:** `POST /auth/login`
- **Nota:** El token se guarda en localStorage

### 2. Gestión de Usuarios (Solo ADMIN)

#### Ver Todos los Usuarios
- **Ruta:** `/users`
- **Descripción:** Lista todos los usuarios del sistema
- **Endpoint:** `GET /users`
- **Rol requerido:** ADMIN

#### Crear Usuario
- **Botón:** "Crear Nuevo Usuario"
- **Campos:**
  - Nombre
  - Email
  - Contraseña
  - Teléfono (opcional)
  - Rol
- **Endpoint:** `POST /users`

#### Actualizar Usuario
- **Botón:** "Editar" en la tabla
- **Campos:** Mismo que crear (contraseña opcional)
- **Endpoint:** `PUT /users/:id`

#### Eliminar Usuario
- **Botón:** "Eliminar" en la tabla
- **Endpoint:** `DELETE /users/:id`

### 3. Gestión de Negocios (Solo ADMIN)

#### Ver Todos los Negocios
- **Ruta:** `/business`
- **Descripción:** Lista todos los negocios
- **Endpoint:** `GET /business`
- **Rol requerido:** ADMIN

#### Crear Negocio
- **Botón:** "Crear Nuevo Negocio"
- **Campos:**
  - Nombre
  - Email (opcional)
  - Teléfono (opcional)
  - Dirección (opcional)
- **Endpoint:** `POST /business`

#### Actualizar Negocio
- **Botón:** "Editar" en la tabla
- **Endpoint:** `PUT /business/:id`

#### Eliminar Negocio
- **Botón:** "Eliminar" en la tabla
- **Endpoint:** `DELETE /business/:id`

### 4. Gestión de Servicios (Solo ADMIN)

#### Ver Todos los Servicios
- **Ruta:** `/services`
- **Descripción:** Lista todos los servicios
- **Endpoint:** `GET /services`
- **Rol requerido:** ADMIN

#### Crear Servicio
- **Botón:** "Crear Nuevo Servicio"
- **Campos:**
  - Nombre
  - Negocio (selector)
  - Duración (minutos)
  - Precio
  - Descripción (opcional)
- **Endpoint:** `POST /services`

#### Actualizar Servicio
- **Botón:** "Editar" en la tabla
- **Endpoint:** `PUT /services/:id`

#### Eliminar Servicio
- **Botón:** "Eliminar" en la tabla
- **Endpoint:** `DELETE /services/:id`

### 5. Gestión de Horarios (Solo ADMIN)

#### Ver Todos los Horarios
- **Ruta:** `/schedules`
- **Descripción:** Lista todos los horarios
- **Endpoint:** `GET /schedules`
- **Rol requerido:** ADMIN

#### Crear Horario
- **Botón:** "Crear Nuevo Horario"
- **Campos:**
  - Negocio (selector)
  - Día de la semana (Lunes-Domingo)
  - Hora de inicio
  - Hora de fin
- **Endpoint:** `POST /schedules`

#### Actualizar Horario
- **Botón:** "Editar" en la tabla
- **Endpoint:** `PUT /schedules/:id`

#### Eliminar Horario
- **Botón:** "Eliminar" en la tabla
- **Endpoint:** `DELETE /schedules/:id`

### 6. Gestión de Reservas (Bookings)

#### Ver Reservas
- **Ruta:** `/bookings`
- **Descripción:** Lista las reservas del usuario
- **Endpoint:** `GET /bookings`

#### Crear Reserva
- **Ruta:** `/dashboard/admin` (para admin)
- **Descripción:** Los administradores pueden crear reservas desde el dashboard
- **Endpoint:** `POST /bookings`

#### Actualizar Reserva
- **Endpoint:** `PUT /bookings/:id`

#### Cambiar Estado de Reserva (Solo ADMIN)
- **Endpoint:** `PUT /bookings/:id/status`

#### Eliminar Reserva
- **Endpoint:** `DELETE /bookings/:id`

### 7. Dashboard de Admin

#### Métricas
- **Ruta:** `/dashboard/admin`
- **Descripción:** Dashboard con métricas del negocio
- **Funcionalidades:**
  - Ver total de reservas
  - Ver ingresos totales
  - Filtrar por período (día, mes, año)
  - Ver reservas por período
  - Ver reservas por servicio
- **Endpoint:** `GET /admin/metrics`

#### Gestión de Empleados
- **Crear empleado**
  - **Endpoint:** `POST /admin/employee`
- **Ver empleados**
  - **Endpoint:** `GET /admin/employees`
- **Actualizar empleado**
  - **Endpoint:** `PUT /admin/employees/:id`
- **Eliminar empleado**
  - **Endpoint:** `DELETE /admin/employees/:id`

## Flujo de Prueba Recomendado

1. **Configurar el Backend:**
   - Asegúrate de tener al menos un usuario ADMIN
   - Puedes usar el endpoint de registro para crear uno

2. **Crear Datos Base:**
   - Login como ADMIN
   - Crear al menos un Negocio
   - Crear servicios para ese negocio
   - Crear horarios para el negocio
   - Crear algunos usuarios (clientes y empleados)

3. **Probar CRUD Completo:**
   - Para cada módulo (Users, Business, Services, Schedules):
     - Crear un registro
     - Editarlo
     - Ver la lista actualizada
     - Eliminarlo

4. **Probar Reservas:**
   - Crear reservas desde el dashboard de admin
   - Ver las métricas actualizadas
   - Filtrar por diferentes períodos

5. **Probar con Usuario CLIENT:**
   - Logout del admin
   - Login como cliente
   - Intentar acceder a rutas de admin (debería denegar acceso)
   - Crear una reserva
   - Ver las reservas

## Endpoints del Backend

Todos los endpoints están documentados en Swagger:
- **URL:** `http://localhost:3000/api`

## Tecnologías Utilizadas

- **React 19** - Framework de UI
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **React Router** - Navegación
- **Axios** - HTTP client
- **Context API** - Gestión de estado (autenticación)

## Estructura de Archivos

```
client/src/
├── components/       # Componentes reutilizables
├── context/         # Context providers (Auth)
├── pages/           # Páginas/Vistas
│   ├── admin.tsx
│   ├── bookings.tsx
│   ├── business.tsx
│   ├── dashboard.tsx
│   ├── home.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── schedules.tsx
│   ├── services.tsx
│   └── users.tsx
├── services/        # API services
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── businessService.ts
│   ├── scheduleService.ts
│   ├── serviceService.ts
│   └── userService.ts
└── App.tsx          # Routing principal
```

## Notas Importantes

- Todas las rutas de gestión (Users, Business, Services, Schedules) requieren rol ADMIN
- El token JWT se guarda en localStorage
- Las rutas están protegidas con el componente PrivateRoute
- El navbar muestra diferentes opciones según el rol del usuario
- Los formularios incluyen validación básica
- Se muestran mensajes de error y éxito para todas las operaciones
