# Plan: Corrección de Bugs del Proyecto Shift Management

## Contexto
El proyecto tiene 15 bugs documentados en `server/todoList.md` que afectan funcionalidad crítica (reservas rotas, rutas 404), experiencia de usuario (mensajes invisibles, falta de feedback) y detalles menores (formato de fechas, idioma). Este plan aborda cada bug de forma ordenada por prioridad.

## Modalidad de Trabajo
**Vos codeás, yo guío.** En cada paso:
1. Te explico el **concepto/patrón** que vas a aplicar
2. Te doy instrucciones claras de qué cambiar y dónde
3. Vos hacés los cambios en el código
4. Yo reviso y te doy feedback

## Fase 0: Test de Conocimiento (antes de empezar)
Evaluación mixta (teoría + código del proyecto) para calibrar las explicaciones.

### Parte A: Preguntas Teóricas (elegí la respuesta correcta)

**1. React — Estado y re-renders**
¿Qué pasa cuando llamás `setState` en React?
- a) Se modifica la variable directamente y el DOM se actualiza
- b) React agenda un re-render del componente con el nuevo valor
- c) Se actualiza el DOM inmediatamente de forma sincrónica
- d) Solo se actualiza si el componente está montado en el viewport

**2. SPA y Routing**
¿Por qué una SPA con React Router da 404 al acceder directo a `/login` en producción?
- a) React Router no funciona en producción
- b) El servidor busca un archivo `/login/index.html` que no existe
- c) El navegador bloquea las rutas que no son la raíz
- d) Falta importar React Router en el build

**3. JWT y Autenticación**
¿Dónde se valida el token JWT en una app NestJS con Passport?
- a) En el controller, antes de cada endpoint
- b) En la Strategy (ej: JwtStrategy), que es invocada por el Guard
- c) En el middleware global de Express
- d) En el frontend, antes de hacer el request

**4. TypeScript — Tipos opcionales**
Si tenés `interface Props { businessId?: string }` y no pasás la prop, ¿qué valor tiene?
- a) `null`
- b) `""` (string vacío)
- c) `undefined`
- d) Genera error de compilación

**5. Prisma — Relaciones**
Si un modelo `Service` tiene `businessId String` con `@relation`, ¿qué pasa si intentás crear un Service con un `businessId` que no existe?
- a) Se crea el Service sin negocio asociado
- b) Prisma lanza un error de foreign key constraint
- c) Se crea el negocio automáticamente
- d) El campo queda como null

### Parte B: Análisis de Código (del proyecto real)

**6. Mirá este código de `navBar.tsx` línea 51:**
```jsx
<Link to={`/business/${businessId}/employees`}>Users</Link>
```
El NavBar se usa así en `admin.tsx` línea 214: `<NavBar />`
- ¿Por qué el link genera `/business/undefined/employees`?
- ¿Cómo lo solucionarías? (describí en una línea)

**7. Mirá este handler de `admin.tsx`:**
```js
const handleCreateEmployee = async (e) => {
  // ... crear empleado via API ...
  setEmployeeSuccess("Empleado creado exitosamente.");
  setNewEmployee({ name: "", email: "", password: "", businessId: selectedBusiness });
  setShowEmployeeForm(false);  // oculta el form
};
```
El `useEffect` que carga empleados tiene deps: `[selectedBusiness, search, page, limit, token]`
- ¿Por qué la lista de empleados NO se actualiza después de crear uno?
- ¿Qué agregarías para que se actualice?

**8. Mirá este código de `BookingForm.tsx` líneas 90-97:**
```js
const [year, month, day] = bookingData.date.split('-').map(Number);
const [hours, minutes] = startTime.split(':').map(Number);
const dateTime = new Date(year, month - 1, day, hours, minutes);
const submitData = {
  date: dateTime.toISOString(),
  timezone: "America/Argentina/Buenos_Aires",
};
```
Si estás en Argentina (UTC-3) y seleccionás 14:00:
- ¿Qué hora va a tener el ISO string que se envía al backend?
- ¿Por qué esto puede causar problemas con la validación de horarios?

**9. Mirá este código de `schedules.tsx`:**
```jsx
{success && (
  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
    {success}
  </div>
)}
```
- ¿Qué pasa con este mensaje después de que aparece? ¿Por qué es un problema de UX?
- ¿Qué función de JS usarías para que desaparezca solo?

**10. NestJS Guards — Mirá este endpoint:**
```typescript
@Get('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE', 'ADMIN')
async searchUsers(@Query('email') email: string) { ... }
```
- ¿Un usuario con rol CLIENT puede acceder a este endpoint? ¿Por qué?
- ¿En qué orden se ejecutan `JwtAuthGuard` y `RolesGuard`?

---

### Resultados del Test: 6/10

| # | Tu respuesta | Correcta | Resultado |
|---|-------------|----------|-----------|
| 1 | d | **b** | ❌ |
| 2 | c | **b** | ❌ |
| 3 | b | b | ✅ |
| 4 | undefined (c) | c | ✅ |
| 5 | b | b | ✅ |
| 6 | Pasar prop businessId | Parcial — funciona pero hay mejor solución | ⚠️ |
| 7 | setPage(1) | Parcial — dispara un re-fetch pero no es la solución ideal | ⚠️ |
| 8 | Hora de España / diferencias | Parcial — el concepto es correcto pero la hora no es de España | ⚠️ |
| 9 | No desaparece / no sé la función | Primera parte ✅, segunda ❌ | ⚠️ |
| 10 | No puede / orden correcto | ✅✅ | ✅ |

### Correcciones detalladas:

**1. React Estado** → La correcta es **b)**
`setState` NO modifica nada directamente. React **agenda** un re-render asincrónico. El nuevo valor recién está disponible en el próximo render. La opción d) es incorrecta porque React re-renderiza aunque el componente no esté visible en el viewport — está montado en el árbol de componentes y eso alcanza.

**2. SPA 404** → La correcta es **b)**
No es que el navegador bloquee nada (opción c). Es el **servidor** (Vercel) el que recibe la petición `/login`, busca un archivo `login.html` o `login/index.html` que no existe, y devuelve 404. El navegador no tiene nada que ver — él solo muestra lo que el servidor le devuelve.

**6. NavBar link** → Tu respuesta funciona pero no es ideal.
Sí, pasar `businessId` como prop soluciona el `undefined`. Pero el problema es: ¿de dónde sacás el `businessId` en `admin.tsx`? Tendrías que cargarlo primero, y si el admin tiene varios negocios, ¿cuál usás? La solución más simple es cambiar el link a `/users` que ya existe como ruta y tiene su propia página para gestionar empleados. Eliminás el problema de raíz.

**7. Refetch empleados** → `setPage(1)` es creativo pero tiene edge cases.
Si ya estás en page 1, el state no cambia → React NO re-renderiza → no se hace fetch. La solución correcta es extraer `fetchEmployees` como función independiente y llamarla directamente:
```js
// Extraer fuera del useEffect:
const fetchEmployees = async () => { /* ... fetch logic ... */ };
// En handleCreateEmployee, después del éxito:
await fetchEmployees();
```

**8. Timezone** → Concepto correcto, detalle incorrecto.
Si estás en Argentina (UTC-3) y ponés 14:00, `new Date(2026, 1, 18, 14, 0)` crea la fecha en hora LOCAL del navegador (14:00 Argentina). `.toISOString()` la convierte a UTC: **17:00:00.000Z** (no hora de España). Si el backend valida que 17:00 UTC está dentro del horario del negocio (que trabaja 09:00-18:00 hora Argentina = 12:00-21:00 UTC), podría funcionar MAL si no considera la timezone correctamente.

**9. Auto-dismiss** → La función es `setTimeout`:
```js
setSuccess("Horario creado exitosamente");
setTimeout(() => setSuccess(null), 4000); // desaparece en 4 segundos
```
`setTimeout` ejecuta una función después de N milisegundos. Al setear `success` a `null`, React re-renderiza y el mensaje desaparece.

### Resumen de tu nivel:
- **Fuerte en:** NestJS guards/auth, TypeScript tipos, Prisma relaciones
- **A reforzar:** React lifecycle (setState asincrónico, useEffect dependencies), manejo de fechas/timezones en JS, APIs del navegador (setTimeout, scrollIntoView)
- **Las guías se van a enfocar en:** explicar bien los conceptos de React y JavaScript nativo que apliquemos en cada fix

---

## Fase 1: Bugs Críticos

### BUG-01: Formulario "Crear Reserva" — lógica por rol
**Archivos:** [BookingForm.tsx](client/src/components/bookingManagement/BookingForm.tsx), [admin.tsx](client/src/pages/admin.tsx), [employeeDashboard.tsx](client/src/pages/employeeDashboard.tsx), [bookings.tsx](client/src/pages/bookings.tsx)

**Lógica de creación de reserva según rol:**

#### ADMIN:
1. Seleccionar servicio (ya existe)
2. **Seleccionar empleado** → dropdown con empleados del negocio, filtrados por disponibilidad para el servicio/horario seleccionado
3. **Seleccionar cliente** → campo de búsqueda por email. Si el cliente no existe, mostrar mini-formulario inline para crear un cliente nuevo (nombre + email + contraseña)
4. Seleccionar fecha y hora

#### EMPLOYEE:
1. Seleccionar servicio
2. **Seleccionar cliente** → búsqueda por email. Si no existe, permitir crear cliente nuevo inline
3. Fecha y hora
4. El empleado asignado es el propio usuario logueado

#### CLIENT:
1. Seleccionar negocio (nuevo)
2. Seleccionar servicio del negocio
3. **Seleccionar empleado** → dropdown con empleados disponibles para ese servicio/horario, con verificación de disponibilidad
4. Fecha y hora
5. El cliente es el usuario logueado automáticamente

**Recursos existentes a reutilizar:**
- `employeeDashboard.tsx` (líneas 599-668) ya tiene búsqueda de cliente por email con `GET /users/search?email=` — copiar patrón
- `GET /users/search?email=` existe (ADMIN/EMPLOYEE only) — reutilizar para buscar clientes
- `POST /auth/register` crea CLIENTs públicamente — reutilizar para "crear cliente nuevo" desde ADMIN/EMPLOYEE
- `findAvailableEmployee()` en `bookings.service.ts` (líneas 250-283) tiene la lógica de disponibilidad

**Endpoints nuevos necesarios (backend):**
1. `GET /bookings/available-employees?businessId=X&date=Y&startTime=Z&duration=N` — público o CLIENT accesible, devuelve empleados disponibles en ese horario
2. `GET /business/public` — endpoint público para listar negocios (para que CLIENT pueda seleccionar)

**Implementación en BookingForm:**
- Agregar prop `role` para condicionar los campos visibles
- Agregar campos `employeeId` y `userId` al `CreateBookingData`
- Reutilizar patrón de búsqueda de `employeeDashboard.tsx` para el componente de búsqueda de cliente
- Crear componente `EmployeeSelector`: dropdown que consulta empleados disponibles al endpoint nuevo
- Para "Crear cliente" inline: formulario con nombre, email, password que llame a `POST /auth/register`

### BUG-02: Página `/bookings` del cliente rota
**Archivo:** [bookings.tsx](client/src/pages/bookings.tsx)
- Rediseñar la página completa con `<NavBar />` y dos secciones:
  1. **Crear reserva**: Selector de negocio → servicios → **selector de empleado disponible** → fecha/hora (usa el `BookingForm` actualizado del BUG-01 con `role="CLIENT"`)
  2. **Mis reservas**: Listado existente mejorado con formato de fechas legible
- Necesita endpoint para listar negocios disponibles (verificar si existe o crear uno público)
- Necesita endpoint para listar empleados disponibles por negocio/servicio/horario
- El `userId` del cliente se toma automáticamente del token (ya lo hace el backend)

### BUG-03: Rutas SPA 404 en Vercel
**Concepto:** En una SPA (Single Page Application), React Router maneja las rutas en el navegador. Pero cuando accedés directamente a `/login`, Vercel busca un archivo `login.html` que no existe → 404. El rewrite le dice a Vercel: "para CUALQUIER ruta, serví `index.html` y dejá que React Router decida qué mostrar".
**Archivo:** Crear `client/vercel.json`
- Crear archivo con rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

---

## Fase 2: Bugs de Prioridad Alta

### BUG-04: Lista de empleados no se refresca tras crear uno
**Concepto:** React re-renderiza cuando cambia el estado. El `useEffect` que carga empleados depende de `[selectedBusiness, search, page, limit, token]`. Si ninguno cambia, no se re-ejecuta. Solución: usar un state "trigger" (counter) como dependencia extra, o extraer la función fetch y llamarla manualmente.
**Archivo:** [admin.tsx](client/src/pages/admin.tsx)
- Extraer `fetchEmployees()` fuera del `useEffect` para poder llamarla desde `handleCreateEmployee`
- Llamar `fetchEmployees()` después de `setEmployeeSuccess(...)`

### BUG-05: Horarios sin validación inicio < fin
**Concepto:** Validación en capas — siempre validar en frontend (UX inmediata) Y en backend (seguridad, ya que el frontend se puede bypasear). Las horas como strings "HH:mm" se pueden comparar directamente con `<` porque el orden lexicográfico coincide con el cronológico.
**Archivo:** [schedules.tsx](client/src/pages/schedules.tsx), [schedules.service.ts](server/src/schedules/schedules.service.ts)
- Frontend: validar `formData.from < formData.to` antes del submit en `handleCreate` y `handleUpdate`
- Backend: validar lo mismo en `create()` y `update()`, lanzar `BadRequestException` si es inválido

### BUG-06: Timezone bug en validación de horarios
**Archivos:** [BookingForm.tsx](client/src/components/bookingManagement/BookingForm.tsx), [bookings.service.ts](server/src/bookings/bookings.service.ts), [CreateBookingDto](server/src/bookings/dto/createBookingDto.dto.ts)
- **Problema raíz**: `BookingForm.tsx` línea 92 usa `new Date(year, month-1, day, hours, minutes).toISOString()` que convierte la hora local del navegador a UTC, causando desfase
- **Enfoque elegido: Backend convierte**
  1. Frontend: enviar `date` ("2026-02-18"), `time` ("14:30") y `timezone` como campos separados (no ISO)
  2. Agregar campo `time` al DTO de creación de booking
  3. Backend: usar `parseLocalDateTime(date, time, timezone)` de `dateUtils.ts` para construir la fecha UTC correcta
  4. Esto elimina completamente la dependencia de la zona horaria del navegador

### BUG-07: Link "Users" apunta a `/business/undefined/employees`
**Concepto:** Cuando un componente recibe una prop opcional (`businessId?: string`) y no se la pasan, su valor es `undefined`. Template literals con `undefined` generan strings como `/business/undefined/employees`. En vez de propagar el estado por muchos componentes (prop drilling), a veces es mejor simplificar la ruta.
**Archivo:** [navBar.tsx](client/src/components/navBar.tsx)
- Línea 51 y 85: cambiar `to={/business/${businessId}/employees}` → `to="/users"`
- La ruta `/users` ya existe en App.tsx y tiene su propia página funcional
- Bonus: se puede eliminar la prop `businessId` del NavBar ya que no se usa en otro lado

---

## Fase 3: Bugs de UX (Prioridad Media)

### BUG-08: Mensajes de éxito/error no desaparecen
**Concepto:** `setTimeout` programa una función para ejecutarse después de N milisegundos. Es el patrón más simple para "auto-dismiss". Importante: en React, si el componente se desmonta antes de que el timer dispare, puede causar warnings. En este caso no es problema porque los componentes son páginas que no se desmontan mientras el usuario las ve.
**Archivos:** [business.tsx](client/src/pages/business.tsx), [services.tsx](client/src/pages/services.tsx), [schedules.tsx](client/src/pages/schedules.tsx), [admin.tsx](client/src/pages/admin.tsx)
- En cada `setSuccess(msg)`, agregar debajo: `setTimeout(() => setSuccess(null), 4000)`
- En cada `setError(msg)`, agregar debajo: `setTimeout(() => setError(null), 5000)` (un poco más de tiempo para leer errores)

### BUG-09: Sin scroll automático al formulario de edición
**Concepto:** `useRef` crea una referencia a un elemento del DOM sin causar re-renders. `scrollIntoView()` es una API nativa del navegador que hace scroll hasta el elemento. El `{ behavior: 'smooth' }` agrega animación. Se usa `setTimeout(..., 0)` para esperar a que React termine el render antes de hacer scroll.
**Archivos:** [business.tsx](client/src/pages/business.tsx), [services.tsx](client/src/pages/services.tsx), [schedules.tsx](client/src/pages/schedules.tsx)
- Agregar `const formRef = useRef<HTMLDivElement>(null)` al componente
- Poner `ref={formRef}` en el contenedor del formulario
- En el handler de "Editar": `setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)`

### BUG-10: Mensaje de éxito al crear empleado invisible
**Archivo:** [admin.tsx](client/src/pages/admin.tsx)
- Mover los mensajes `employeeSuccess`/`employeeError` (líneas 288-297) FUERA del form (que se oculta en línea 154)
- Colocarlos antes del botón "Crear nuevo empleado" para que sean siempre visibles
- Aplicar auto-dismiss del BUG-08

### BUG-11: Sin feedback al editar empleado
**Archivo:** [admin.tsx](client/src/pages/admin.tsx)
- Ya tiene `editEmployeeSuccess` (línea 202) que se muestra en el modal
- El modal se cierra después de 3 segundos (línea 204)
- Fix: Mostrar el mensaje de éxito FUERA del modal (en el dashboard) después de cerrarlo, usando un state de feedback general

---

## Fase 4: Bugs Menores

### BUG-12: Typo "navajaa" en seed
**Archivo:** [seed.ts](server/prisma/seed.ts)
- La exploración del backend indica que el typo ya NO existe (línea 167 dice "navaja" correctamente)
- Verificar en la base de datos de producción/desarrollo si el dato incorrecto persiste de un seed anterior
- Si es necesario, crear un script de corrección o corregir manualmente

### BUG-13: Fechas ISO sin formatear en tabla de métricas
**Concepto:** `Intl.DateTimeFormat` (o su atajo `toLocaleString`) es la API nativa de JS para formatear fechas según la localidad. Es mejor que librerías externas para casos simples. `'es-AR'` formatea al estilo argentino (DD/MM/YYYY).
**Archivo:** [admin.tsx](client/src/pages/admin.tsx)
- Línea 414: cambiar `{b.date}` por `{new Date(b.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`

### BUG-14: Inconsistencia de idioma (inglés/español)
**Concepto:** Patrón "label map" — un objeto que mapea valores internos (constantes en inglés, que no cambian) a valores de presentación (español). Es el paso previo a una solución completa de i18n (internacionalización). Se centraliza en un solo lugar para no repetir traducciones.
**Archivos:** [BookingForm.tsx](client/src/components/bookingManagement/BookingForm.tsx), componentes de estado
- Traducir labels del form: "Date" → "Fecha", "Start Time" → "Hora de inicio", "Notes" → "Notas", "Create Booking" → "Crear Reserva"
- Crear mapa de estados reutilizable: `{ PENDING: 'Pendiente', CONFIRMED: 'Confirmado', COMPLETED: 'Completado', CANCELLED: 'Cancelado' }`
- Aplicar en: BookingStatus, BookingStatusButton, dashboard, bookings

### BUG-15: Servicios sin negocio asignado
- La exploración del seed muestra que todos los servicios TIENEN businessId asignado
- Este problema puede ser de datos residuales en la BD de un seed anterior
- Fix: re-ejecutar seed o corregir datos manualmente. No requiere cambio de código

---

## Orden de Implementación Recomendado

| Paso | Bugs | Descripción | Archivos afectados |
|------|------|-------------|--------------------|
| 1 | BUG-03 | Crear `client/vercel.json` con rewrites | 1 archivo nuevo |
| 2 | BUG-07 | Cambiar link navbar de `/business/${businessId}/employees` a `/users` | `navBar.tsx` (2 líneas) |
| 3 | BUG-04 | Refetch de empleados tras crear uno | `admin.tsx` (~5 líneas) |
| 4 | BUG-05 | Validación inicio < fin en horarios (frontend + backend) | `schedules.tsx`, `schedules.service.ts` |
| 5 | BUG-08+10+11 | Auto-dismiss de mensajes + reposicionar mensajes empleado | `business.tsx`, `services.tsx`, `schedules.tsx`, `admin.tsx` |
| 6 | BUG-09 | Scroll automático al formulario de edición | `business.tsx`, `services.tsx`, `schedules.tsx` |
| 7 | BUG-13 | Formatear fechas ISO en tabla de métricas | `admin.tsx` (1 línea) |
| 8 | BUG-14 | Traducir labels inglés → español + mapeo de estados | `BookingForm.tsx`, `BookingStatus.tsx`, `bookings.tsx` |
| 9 | **Backend** | Crear endpoints: `GET /business/public` + `GET /bookings/available-employees` | `business.controller.ts`, `bookings.controller.ts`, `bookings.service.ts` |
| 10 | BUG-06 | Timezone: frontend envía strings, backend convierte | `BookingForm.tsx`, `createBookingDto.dto.ts`, `bookings.service.ts` |
| 11 | BUG-01 | BookingForm: selector de empleado + búsqueda/creación de cliente según rol | `BookingForm.tsx`, `admin.tsx`, nuevos componentes |
| 12 | BUG-02 | Rediseño página `/bookings` del cliente | `bookings.tsx` |
| 13 | BUG-12+15 | Verificar datos en BD (seed ya correcto) | Solo seed/BD si aplica |

---

## Trabajo Actual: Reservas (BUG-01 + BUG-02)

### Estado al 20/02/2026 — qué ya está hecho ✅

| Archivo | Cambio realizado |
|---|---|
| `schema.prisma` | `userId String?` + `onDelete: SetNull` + migración `20260219230524_allow_walking_bookings` ✅ |
| `bookings.controller.ts` | ADMIN requiere userId, EMPLOYEE opcional (walk-in), CLIENT usa propio userId del token ✅ |
| `bookings.service.ts` | Firma acepta `userId: string \| null` ✅ |
| `BookingsDto.dto.ts` | `userId: string \| null` ✅ |
| `BookingForm.tsx` | `role` prop, `effectiveBusinessId`, useEffect `/business/public` (CLIENT), useEffect `/bookings/available-employees`, `handleSubmit` con timezone dinámica y spread de `employeeId` ✅ |
| `bookings.tsx` | URL corregida: `/bookings/my-bookings` ✅ |

### Cambios pendientes

#### Paso 1 — `BookingForm.tsx`: Reordenar JSX (5 min)

**Concepto:** El orden de los campos en el formulario afecta la UX. El servicio debe ir antes de fecha/hora porque `durationMin` del servicio determina el `endTime` para buscar empleados disponibles. El selector de empleado debe ir al final porque depende de los tres campos anteriores.

**Orden actual (incorrecto):**
```
Negocio → Empleado → Fecha → Hora → Servicio → Notas
```
**Orden correcto:**
```
Negocio → Servicio → Fecha → Hora → Empleado → Notas
```

**Qué hacer:** Cortar el bloque `{/*Employee selection */}` (líneas 209-230) y pegarlo DESPUÉS del bloque de Fecha+Hora (después de línea 253). Cortar el bloque `{/*SERVICE SELECTOR*/}` (líneas 255-283) y pegarlo ANTES del bloque de Fecha (antes de línea 232).

**Resultado esperado del JSX:**
```tsx
{/* 1. Negocio - solo CLIENT */}
{role === 'CLIENT' && <div col-span-2>...</div>}

{/* 2. Servicio */}
<div col-span-2>{role === 'CLIENT' ? <select> : <ServiceSelector>}</div>

{/* 3. Fecha */}
<div><input type="date"></div>

{/* 4. Hora */}
<div><input type="time"></div>

{/* 5. Empleado */}
<div col-span-2><select disabled={!selectedService || !startTime || !bookingData.date}></div>

{/* 6. Notas */}
<div col-span-2><textarea></div>
```

---

#### Paso 2 — `admin.tsx`: Agregar `role="ADMIN"` (1 línea)

**Concepto:** `role` es una prop requerida en `BookingFormProps` (`role: 'ADMIN' | 'CLIENT'`). Sin pasarla, TypeScript dará error de compilación.

**Qué hacer:** Buscar la línea donde está `<BookingForm` en admin.tsx (~línea 473) y agregar `role="ADMIN"`:
```tsx
// Antes:
<BookingForm onSubmit={...} businessId={selectedBusiness} />
// Después:
<BookingForm onSubmit={...} businessId={selectedBusiness} role="ADMIN" />
```

---

#### Paso 3 — `employeeDashboard.tsx`: Walk-in + selector de empleado disponible

**Contexto:** Este archivo tiene su propio formulario custom (no usa `BookingForm`). Ya tiene búsqueda de cliente por email. Tiene DOS problemas:
1. Validación obligatoria de `selectedClient` bloquea walk-in (línea ~262)
2. No tiene selector de empleado disponible

**Sobre walk-in:**
- El **backend ya soporta walk-in**: para EMPLOYEE, si no viene `userId`, el controller lo pone en `null` automáticamente (`createBookingDto.userId ?? null`)
- El **frontend lo bloquea** con: `if (!selectedClient) { setCreateError('Debes seleccionar un cliente'); return; }`
- Fix: agregar checkbox "Cliente walk-in (sin registro)" que desactiva la búsqueda y envía sin `userId`

**Qué hacer:**

**A) Walk-in support:**
1. Agregar estado `const [isWalkin, setIsWalkin] = useState(false)`
2. Agregar checkbox antes del campo de búsqueda:
   ```tsx
   <label>
     <input type="checkbox" checked={isWalkin} onChange={e => { setIsWalkin(e.target.checked); setSelectedClient(null); }} />
     {' '}Cliente walk-in (sin cuenta)
   </label>
   ```
3. Cambiar la validación:
   ```ts
   // Antes: if (!selectedClient) { ... return; }
   // Después:
   if (!isWalkin && !selectedClient) {
     setCreateError('Seleccioná un cliente o marcá como walk-in');
     return;
   }
   ```
4. En el body del request: `...(selectedClient && { userId: selectedClient.id })` — si es walk-in, no se envía `userId` y el backend lo pone en `null`

**B) Selector de empleado disponible:**
1. Agregar estado `const [availableEmps, setAvailableEmps] = useState<{id: string; name: string}[]>([])` y `const [selectedEmpId, setSelectedEmpId] = useState<string>('')`
2. Agregar useEffect que observa `formData.serviceId + formData.date + formData.startTime`:
   - Si todos tienen valor, llamar a `/bookings/available-employees?businessId=X&date=Y&endTime=Z`
   - El `businessId` viene del negocio del empleado logueado (`employeeData?.businessId` o similar)
3. Agregar dropdown DESPUÉS del input de hora:
   ```tsx
   <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
     <option value="">Yo mismo</option>
     {availableEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
   </select>
   ```
4. Al crear la reserva: `...(selectedEmpId && { employeeId: selectedEmpId })` — si queda vacío, el backend asigna automáticamente al empleado disponible

---

#### Paso 4 — `bookings.tsx`: Rediseño completo (BUG-02)

**Contexto:** La página del CLIENT solo lista reservas. Necesita poder crear reservas también.

**Concepto:** Dividir en dos secciones en la misma página — "Nueva Reserva" y "Mis Reservas". `BookingForm` con `role="CLIENT"` maneja todo el formulario (negocio, servicio, empleado disponible, fecha, hora). El handler `onSubmit` llama a la función `createBooking` del `bookingService.ts`.

**Qué hacer:**
1. Agregar imports: `NavBar`, `BookingForm`, `CreateBookingData` de `BookingForm`, `createBooking` de `bookingService`, `useAuth`
2. Agregar estados: `const [createSuccess, setCreateSuccess] = useState<string | null>(null)` y `const [createError, setCreateError] = useState<string | null>(null)`
3. Agregar handler:
   ```tsx
   const handleCreateBooking = async (data: CreateBookingData) => {
     await createBooking(data);
     setCreateSuccess('Reserva creada exitosamente');
     setTimeout(() => setCreateSuccess(null), 4000);
     fetchBookings(); // refresca la lista
   };
   ```
4. Reemplazar el JSX actual por:
   ```tsx
   <>
     <NavBar />
     <div className="container mx-auto p-4 max-w-2xl">
       <h1>Reservas</h1>

       <section className="mb-8">
         <h2>Nueva Reserva</h2>
         {createSuccess && <div className="bg-green-100...">{createSuccess}</div>}
         {createError && <div className="bg-red-100...">{createError}</div>}
         <BookingForm role="CLIENT" onSubmit={handleCreateBooking} />
       </section>

       <section>
         <h2>Mis Reservas</h2>
         {/* lista existente */}
       </section>
     </div>
   </>
   ```

## Verificación

1. **Frontend**: Ejecutar `npm run dev` en `client/` y probar cada flujo manualmente:
   - Login como ADMIN → verificar navbar, crear reserva con selector de cliente, crear empleado y ver que la lista se actualice
   - Login como CLIENT → verificar `/bookings` funcional, crear reserva
   - Verificar mensajes de éxito/error desaparecen en ~4s
   - Verificar scroll al editar en Business/Services/Schedules
   - Verificar fechas formateadas en tabla de métricas
2. **Backend**: Ejecutar `npm run start:dev` en `server/` y verificar que la validación de horarios (inicio < fin) rechace datos inválidos
3. **Build**: `npm run build` en ambos proyectos para verificar que no hay errores de TypeScript
4. **Despliegue**: Verificar que `vercel.json` funcione accediendo directamente a rutas como `/login`
