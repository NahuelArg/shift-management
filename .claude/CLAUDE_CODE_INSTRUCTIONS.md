# Claude Code — Instrucciones de implementación: Shift Management UI Gaps

## Contexto

Este documento describe los **gaps pendientes** entre el rediseño de referencia (archivos HTML en esta carpeta) y el estado actual del codebase en `https://github.com/NahuelArg/shift-management`.

**Lo que ya está bien implementado** (no tocar):
- Sidebar colapsable con roles (`Sidebar.tsx`)
- TopBar, AppShell, MobileTabBar
- Design tokens OKLCH en `tailwind.config.js`
- DM Sans + DM Mono en `index.css`
- Componentes UI: StatCard, StatusBadge, Avatar, Button, Input, Modal, Select, Toast
- SidebarContext
- Login split-panel (desktop)
- Calendario semanal/diario con mini-cal y filtro de empleados
- Calendario mobile: vista 3 días centrada en hoy (ya implementada)

**Stack**: React 19 + TypeScript + Tailwind CSS + React Router v7 + Axios + NestJS backend

---

## Reglas generales

- Usar clases Tailwind siempre que sea posible (no CSS inline)
- Componentes UI reutilizables ya existen en `client/src/components/ui/` — usarlos, no duplicar
- Mantener todos los endpoints y servicios existentes intactos
- No cambiar AuthContext, lógica de auth, ni PrivateRoute
- Cada página ya tiene sus llamadas a la API — solo cambiar presentación, no lógica
- Referencia visual: abrir `Shift Admin Screens.html` y `Shift Management.html` del handoff

---

## Gap 1 — Calendario: detalles finos

**Archivo:** `client/src/pages/calendar.tsx`

### 1a. Línea "ahora" (current time indicator)

Agregar un indicador rojo de la hora actual en la columna de hoy, que se actualice cada minuto.

```tsx
// Dentro del componente Calendar, agregar:
const [nowMinutes, setNowMinutes] = useState(() => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
});

useEffect(() => {
  const interval = setInterval(() => {
    const n = new Date();
    setNowMinutes(n.getHours() * 60 + n.getMinutes());
  }, 60_000);
  return () => clearInterval(interval);
}, []);
```

En la vista semana, dentro de la columna que corresponde a `isSameDay(day, new Date())`:
```tsx
{isSameDay(day, new Date()) && (
  <div
    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
    style={{ top: `${((nowMinutes - 8 * 60) / (HOURS.length * 60)) * 100}%` }}
  >
    <div className="w-2 h-2 rounded-full bg-danger shrink-0 -ml-1" />
    <div className="flex-1 h-px bg-danger" />
  </div>
)}
```

Mismo patrón en la vista día, para cada columna de empleado.

### 1b. Líneas de media hora (dashed)

Actualmente solo hay líneas de hora completa. Agregar líneas punteadas a los :30:

```tsx
{HOURS.map(h => (
  <React.Fragment key={h}>
    {/* Hora completa — solid */}
    <div
      className="absolute w-full border-t border-border/40"
      style={{ top: `${(h - 8) * CELL_H}px` }}
    />
    {/* Media hora — dashed */}
    <div
      className="absolute w-full border-t border-dashed border-border/20"
      style={{ top: `${(h - 8) * CELL_H + CELL_H / 2}px` }}
    />
  </React.Fragment>
))}
```

### 1c. DM Mono en etiquetas de hora

Las etiquetas `08:00`, `09:00` etc. deben usar `font-mono`:
```tsx
<span className="text-xs text-content-3 mt-1 font-mono">{hLabel(h)}</span>
```

### 1d. Panel de detalle lateral (slide-in) en desktop

Actualmente el detalle abre en un `Modal` centrado. En desktop (≥ md), debe ser un panel lateral deslizable (slide-in desde la derecha, dentro del área del calendario, no fixed). En mobile mantener el modal.

```tsx
// En el área principal, cambiar la estructura:
<div className="flex-1 min-w-0 flex overflow-hidden relative">
  {/* Grid del calendario */}
  <div className={`flex flex-col bg-surface rounded-xl shadow-card border border-border overflow-hidden transition-all duration-200
    ${selectedBkg && !isMobile ? 'flex-1' : 'flex-1'}`}>
    {/* ...grid existente... */}
  </div>

  {/* Panel lateral de detalle — desktop only */}
  {selectedBkg && (
    <aside className="hidden md:flex w-72 shrink-0 ml-4 bg-surface rounded-xl shadow-card border border-border flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-bold text-content">Detalle del turno</span>
        <button onClick={() => setSelectedBkg(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 text-content-3 transition-colors">
          ✕
        </button>
      </div>
      {/* Contenido igual al modal actual */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ...mismos campos del modal... */}
        {/* Agregar acciones de estado */}
        {selectedBkg.status !== 'CANCELLED' && selectedBkg.status !== 'COMPLETED' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {selectedBkg.status === 'PENDING' && (
              <button className="w-full py-2 rounded-lg bg-success text-white text-sm font-semibold">
                Confirmar turno
              </button>
            )}
            <button className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold">
              Marcar completado
            </button>
            <button className="w-full py-2 rounded-lg border border-border text-danger text-sm font-semibold">
              Cancelar turno
            </button>
          </div>
        )}
      </div>
    </aside>
  )}
</div>
```

Agregar keyframe en `tailwind.config.js`:
```js
'slide-in-right': {
  from: { transform: 'translateX(20px)', opacity: '0' },
  to:   { transform: 'translateX(0)',    opacity: '1' },
},
// En animation:
'slide-in-right': 'slide-in-right 0.2s ease-out',
```

El Modal existente solo mostrarlo en mobile (`md:hidden`):
```tsx
<Modal open={!!selectedBkg && isMobile} onClose={() => setSelectedBkg(null)} ...>
```

Donde `isMobile` se puede detectar con:
```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
// O mejor con un hook useMediaQuery
```

---

## Gap 2 — Employee Dashboard: mejoras visuales

**Archivo:** `client/src/pages/employeeDashboard.tsx`

### 2a. Sección "Turnos de hoy" destacada

Los turnos del día actual deben tener un bloque visual diferenciado, encima del listado general.

```tsx
// Filtrar turnos de hoy
const todayStr = new Date().toISOString().slice(0, 10);
const todayBookings = sortedBookings.filter(b => b.date.startsWith(todayStr));
const otherBookings = sortedBookings.filter(b => !b.date.startsWith(todayStr));

// Renderizar sección de hoy (si hay turnos)
{todayBookings.length > 0 && (
  <div className="mb-6 p-4 rounded-xl bg-success/5 border border-success/20">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold text-success uppercase tracking-wider">
        Turnos de hoy — {todayBookings.length}
      </p>
      {/* Barra de progreso */}
      <span className="text-xs text-content-3">
        {todayBookings.filter(b => b.status === 'COMPLETED').length} / {todayBookings.length} completados
      </span>
    </div>
    {/* Barra de progreso */}
    <div className="h-1.5 bg-surface-3 rounded-full mb-4 overflow-hidden">
      <div
        className="h-full bg-success rounded-full transition-all duration-500"
        style={{ width: `${(todayBookings.filter(b => b.status === 'COMPLETED').length / todayBookings.length) * 100}%` }}
      />
    </div>
    {/* Cards de turnos de hoy */}
    <div className="space-y-2">
      {todayBookings.map(booking => (
        <div key={booking.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border shadow-sm">
          {/* Hora badge */}
          <div className="bg-success-light rounded-lg px-2 py-2 text-center shrink-0 min-w-[48px]">
            <p className="text-xs font-bold text-success font-mono leading-none">{booking.startTime}</p>
            <p className="text-xs text-success opacity-70 mt-0.5">{booking.service.durationMin}m</p>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-content truncate">{booking.user?.name ?? 'Walk-in'}</p>
            <p className="text-xs text-content-3">{booking.service.name}</p>
          </div>
          {/* Precio + acciones */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold text-content font-mono">${booking.finalPrice.toLocaleString()}</span>
            <StatusBadge label={booking.status} variant={bookingStatusVariant(booking.status)} />
            {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
              <button
                onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                className="px-2.5 py-1 rounded-lg bg-success text-white text-xs font-semibold"
              >
                ✓
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 2b. Filtros por estado (chips)

Agregar antes de la lista general:
```tsx
const [filterStatus, setFilterStatus] = useState<string>('all');

const FILTER_OPTIONS = [
  { id: 'all',       label: 'Todos' },
  { id: 'PENDING',   label: 'Pendientes' },
  { id: 'CONFIRMED', label: 'Confirmados' },
  { id: 'COMPLETED', label: 'Completados' },
];

// UI:
<div className="flex gap-2 flex-wrap mb-4">
  {FILTER_OPTIONS.map(opt => (
    <button
      key={opt.id}
      onClick={() => setFilterStatus(opt.id)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
        ${filterStatus === opt.id
          ? 'bg-primary text-content-inverse'
          : 'bg-surface-3 text-content-2 hover:bg-surface-2'}`}
    >
      {opt.label}
    </button>
  ))}
</div>

// Filtrar la lista:
const displayedBookings = (filterStatus === 'all' ? otherBookings : otherBookings.filter(b => b.status === filterStatus));
```

---

## Gap 3 — Servicios: stats row + mejoras de tabla

**Archivo:** `client/src/pages/services.tsx`

### 3a. Stats row encima de la tabla

```tsx
// Calcular stats de los servicios cargados
const avgPrice    = services.length ? Math.round(services.reduce((s, sv) => s + sv.price, 0) / services.length) : 0;
const avgDuration = services.length ? Math.round(services.reduce((s, sv) => s + sv.durationMin, 0) / services.length) : 0;
const bizCount    = new Set(services.map(sv => sv.businessId)).size;

// Render — antes de los filtros:
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
  <StatCard label="Total servicios" value={services.length}   icon={<ScissorsIcon />} accent="primary" />
  <StatCard label="Precio promedio" value={`$${avgPrice.toLocaleString()}`} icon={<CoinIcon />} accent="success" />
  <StatCard label="Duración prom."  value={`${avgDuration} min`}            icon={<ClockIcon />} accent="warning" />
  <StatCard label="Negocios"        value={bizCount}          icon={<BuildingIcon />} accent="info" />
</div>
```

### 3b. Acciones como íconos con hover coloreado

Reemplazar los botones de texto "Editar" / "Eliminar" por íconos:

```tsx
// En cada fila de la tabla, columna de acciones:
<div className="flex items-center gap-1">
  <button
    onClick={() => handleEdit(service)}
    className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3
               hover:border-primary hover:text-primary hover:bg-primary-light transition-colors"
    title="Editar"
  >
    <PencilIcon size={13} />
  </button>
  <button
    onClick={() => handleDelete(service.id)}
    className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3
               hover:border-danger hover:text-danger hover:bg-danger-light transition-colors"
    title="Eliminar"
  >
    <TrashIcon size={13} />
  </button>
</div>
```

### 3c. Filtro por negocio en toolbar

```tsx
const [filterBusiness, setFilterBusiness] = useState('all');

// En el toolbar (junto al search):
<select
  value={filterBusiness}
  onChange={e => setFilterBusiness(e.target.value)}
  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-content focus:border-primary outline-none"
>
  <option value="all">Todos los negocios</option>
  {businesses.map(b => (
    <option key={b.id} value={b.id}>{b.name}</option>
  ))}
</select>

// Filtrar:
const filtered = services.filter(s =>
  (filterBusiness === 'all' || s.businessId === filterBusiness) &&
  // ...búsqueda por nombre si ya existe...
);
```

---

## Gap 4 — Horarios: vista semanal grid

**Archivo:** `client/src/pages/schedules.tsx`

### 4a. Agregar vista semanal visual encima de la tabla

```tsx
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Render — antes de la tabla existente:
<div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden mb-6">
  <div className="px-4 py-3 border-b border-border">
    <p className="text-sm font-semibold text-content">Vista semanal</p>
  </div>
  <div className="grid grid-cols-7">
    {[0,1,2,3,4,5,6].map((dayIdx, i) => {
      const daySchedules = schedules.filter(s =>
        s.businessId === selectedBusinessId && s.dayOfWeek === dayIdx
      );
      const isWeekend = dayIdx === 0 || dayIdx === 6;
      return (
        <div
          key={dayIdx}
          className={`p-3 min-h-[80px] border-r border-border last:border-r-0
            ${daySchedules.length > 0 ? 'bg-bg' : 'bg-surface-2'}
            ${isWeekend && daySchedules.length === 0 ? 'opacity-50' : ''}`}
        >
          <p className={`text-xs font-bold uppercase tracking-wider mb-2
            ${daySchedules.length > 0 ? 'text-primary' : 'text-content-3'}`}>
            {DAYS_SHORT[dayIdx]}
          </p>
          {daySchedules.length > 0 ? (
            daySchedules.map(s => (
              <button
                key={s.id}
                onClick={() => handleEdit(s)}
                className="w-full text-left px-2 py-1.5 rounded-md mb-1
                           bg-primary/10 border border-primary/30
                           hover:bg-primary/15 transition-colors"
              >
                <p className="text-xs font-bold text-primary font-mono">
                  {s.from}–{s.to}
                </p>
              </button>
            ))
          ) : (
            <p className="text-xs text-content-3 italic">Cerrado</p>
          )}
        </div>
      );
    })}
  </div>
</div>
```

### 4b. Cálculo automático de duración en modal

Agregar debajo de los inputs de hora en el formulario:

```tsx
{formData.from && formData.to && (() => {
  const [h1, m1] = formData.from.split(':').map(Number);
  const [h2, m2] = formData.to.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return (
    <p className="text-xs text-danger bg-danger-light px-3 py-2 rounded-lg">
      ⚠️ La hora de cierre debe ser posterior a la de apertura
    </p>
  );
  return (
    <p className="text-xs text-primary bg-primary-light px-3 py-2 rounded-lg font-medium">
      ⏱ Duración: {Math.floor(mins / 60)}h {mins % 60}m
    </p>
  );
})()}
```

---

## Gap 5 — Negocio: layout maestro-detalle

**Archivo:** `client/src/pages/business.tsx`

### Layout actual → master-detail

Cambiar el layout de la página a dos paneles:

```tsx
return (
  <div className="flex gap-4 h-full min-h-0">

    {/* Panel izquierdo — lista de negocios */}
    <aside className="w-64 shrink-0 bg-surface rounded-xl shadow-card border border-border flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-xs font-bold text-content-3 uppercase tracking-wider">
          Mis negocios ({businesses.length})
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {businesses.map(business => (
          <button
            key={business.id}
            onClick={() => setSelectedBusiness(business)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all
              ${selectedBusiness?.id === business.id
                ? 'bg-info/10 border-l-2 border-info'
                : 'hover:bg-surface-2 border-l-2 border-transparent'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-info-light flex items-center justify-center shrink-0">
              <BuildingIcon className="text-info" size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content truncate">{business.name}</p>
              <p className="text-xs text-content-3">
                {/* Mostrar cant. servicios si está disponible */}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>

    {/* Panel derecho — detalle */}
    {selectedBusiness ? (
      <div className="flex-1 min-w-0 overflow-y-auto space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-info-light border border-info/20 flex items-center justify-center">
              <BuildingIcon size={24} className="text-info" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-content">{selectedBusiness.name}</h2>
              <p className="text-sm text-content-3">
                Creado: {new Date(selectedBusiness.createdAt).toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleEdit(selectedBusiness)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-content-2 hover:border-info hover:text-info transition-colors"
          >
            <PencilIcon size={14} /> Editar
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Dirección', value: selectedBusiness.address, emoji: '📍' },
            { label: 'Teléfono',  value: selectedBusiness.phone,   emoji: '📞' },
            { label: 'Email',     value: selectedBusiness.email,   emoji: '✉️' },
          ].map(info => (
            <div key={info.label} className="flex items-center gap-3 p-4 bg-surface rounded-xl shadow-card border border-border">
              <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center text-base shrink-0">
                {info.emoji}
              </div>
              <div>
                <p className="text-xs text-content-3 uppercase tracking-wider">{info.label}</p>
                <p className="text-sm font-medium text-content">{info.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Servicios del negocio */}
        {/* Reutilizar la lógica existente de servicios, filtrada por businessId */}
      </div>
    ) : (
      <div className="flex-1 flex items-center justify-center text-content-3 text-sm">
        Seleccioná un negocio para ver el detalle
      </div>
    )}
  </div>
);
```

Agregar state: `const [selectedBusiness, setSelectedBusiness] = useState(businesses[0] ?? null);`
Actualizar `selectedBusiness` cuando cambie `businesses`.

---

## Gap 6 — Usuarios: stats row + panel de detalle

**Archivo:** `client/src/pages/users.tsx`

### 6a. Stats row

```tsx
const adminCount    = users.filter(u => u.role === 'ADMIN').length;
const employeeCount = users.filter(u => u.role === 'EMPLOYEE').length;
const clientCount   = users.filter(u => u.role === 'CLIENT').length;

// Antes de los filtros:
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
  <StatCard label="Total usuarios" value={users.length}   icon={<UsersIcon />} accent="primary" />
  <StatCard label="Admins"         value={adminCount}     icon={<ShieldIcon />} accent="info" />
  <StatCard label="Empleados"      value={employeeCount}  icon={<UsersIcon />} accent="success" />
  <StatCard label="Clientes"       value={clientCount}    icon={<UserIcon />} accent="warning" />
</div>
```

### 6b. Filtros por rol (chips)

```tsx
const [filterRole, setFilterRole] = useState<string>('all');

const ROLE_FILTERS = [
  { id: 'all',      label: 'Todos' },
  { id: 'ADMIN',    label: 'Admins' },
  { id: 'EMPLOYEE', label: 'Empleados' },
  { id: 'CLIENT',   label: 'Clientes' },
];

// UI (junto al search):
<div className="flex gap-2 flex-wrap">
  {ROLE_FILTERS.map(f => (
    <button
      key={f.id}
      onClick={() => setFilterRole(f.id)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
        ${filterRole === f.id
          ? 'bg-primary text-content-inverse'
          : 'bg-surface-3 text-content-2 hover:bg-surface-2'}`}
    >
      {f.label}
    </button>
  ))}
</div>
```

### 6c. Panel lateral de detalle (click en fila)

```tsx
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// Cambiar layout de la página:
<div className="flex gap-4 h-full min-h-0">
  <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
    {/* stats + filtros + tabla existente */}
    {/* En cada fila de la tabla: onClick={() => setSelectedUser(user)} */}
    {/* Fila activa: className con border-l-2 border-warning */}
  </div>

  {/* Panel lateral — aparece al seleccionar un usuario */}
  {selectedUser && (
    <aside className="w-64 shrink-0 bg-surface rounded-xl shadow-card border border-border flex flex-col overflow-hidden animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-bold text-content-3 uppercase tracking-wider">Detalle</span>
        <button onClick={() => setSelectedUser(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-3 text-content-3">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Avatar centrado */}
        <div className="text-center py-2">
          <Avatar name={selectedUser.name} size="lg" className="mx-auto mb-2" />
          <p className="font-bold text-content">{selectedUser.name}</p>
          <StatusBadge label={selectedUser.role} variant={roleVariant(selectedUser.role)} className="mt-1" />
        </div>
        {/* Campos de detalle */}
        {[
          { label: 'Email',     value: selectedUser.email },
          { label: 'Reservas',  value: selectedUser.bookingsCount ?? 0 },
          { label: 'Alta',      value: new Date(selectedUser.createdAt).toLocaleDateString('es-AR') },
        ].map(f => (
          <div key={f.label} className="p-3 bg-surface-2 rounded-lg">
            <p className="text-xs text-content-3 uppercase tracking-wider">{f.label}</p>
            <p className="text-sm font-semibold text-content mt-0.5 break-all">{String(f.value)}</p>
          </div>
        ))}
        {/* Acciones */}
        <div className="space-y-2 pt-2">
          <button className="w-full py-2 rounded-lg border border-border text-sm font-medium text-content-2 hover:border-primary hover:text-primary transition-colors">
            Editar usuario
          </button>
        </div>
      </div>
    </aside>
  )}
</div>
```

---

## Gap 7 — Home Page: secciones faltantes

**Archivo:** `client/src/pages/home.tsx`

El home actual tiene: hero + 4 feature cards + footer. Agregar las siguientes secciones, en este orden:

### 7a. Ticker animado (entre hero y features)

```tsx
// En tailwind.config.js agregar:
ticker: {
  from: { transform: 'translateX(0)' },
  to:   { transform: 'translateX(-50%)' },
},
// animation: 'ticker': 'ticker 20s linear infinite',

// Componente:
const TICKER_ITEMS = [
  'Gestión de turnos', 'Empleados', 'Métricas', 'Reservas en línea',
  'Notificaciones', 'Control de horarios', 'Multi-negocio', 'Panel de empleado',
];

<div className="overflow-hidden border-y border-white/10 bg-white/5 py-4 my-0">
  <div className="flex gap-10 animate-ticker whitespace-nowrap w-max">
    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
      <div key={i} className="flex items-center gap-3 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-sm font-medium text-sidebar-text">{item}</span>
      </div>
    ))}
  </div>
</div>
```

### 7b. Stats section (después del ticker)

```tsx
const STATS = [
  { value: '+200', label: 'Negocios activos' },
  { value: '4',    label: 'Roles diferenciados' },
  { value: '24',   label: 'Issues de seguridad resueltos' },
  { value: '100%', label: 'TypeScript' },
];

<section className="px-6 lg:px-12 py-16 border-b border-white/10">
  <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
    {STATS.map(s => (
      <div key={s.label}>
        <p className="text-4xl lg:text-5xl font-bold text-white font-mono mb-2">{s.value}</p>
        <p className="text-sm text-sidebar-text">{s.label}</p>
      </div>
    ))}
  </div>
</section>
```

### 7c. Roles section (después de features)

```tsx
const ROLES = {
  ADMIN: {
    label: 'Admin',
    color: 'text-info',
    bg: 'bg-info-light',
    features: ['Dashboard con métricas', 'Gestión de empleados', 'Crear y cancelar reservas', 'Servicios y horarios', 'Multi-negocio'],
  },
  EMPLOYEE: {
    label: 'Empleado',
    color: 'text-success',
    bg: 'bg-success-light',
    features: ['Turnos asignados', 'Confirmar y completar', 'Reservas walk-in', 'Búsqueda de clientes', 'Historial'],
  },
  CLIENT: {
    label: 'Cliente',
    color: 'text-warning',
    bg: 'bg-warning-light',
    features: ['Reservar en 3 pasos', 'Ver próximos turnos', 'Historial de reservas', 'Cancelar turnos', 'Notificaciones'],
  },
};

// Implementar con useState para el tab activo
```

---

## Gap 8 — Login: credenciales demo en mobile

**Archivo:** `client/src/pages/login.tsx`

Ya documentado en `MOBILE_FIXES.md`. Agregar bloque `lg:hidden` con `TEST_CREDENTIALS` dentro del panel derecho, debajo del `<Button>` de submit.

---

## Orden de implementación sugerido

| Prioridad | Gap | Impacto | Esfuerzo |
|-----------|-----|---------|----------|
| 1 | Login mobile (Gap 8) | Alto | Muy bajo (20 líneas) |
| 2 | Calendario: línea ahora + DM Mono (Gap 1a/1c) | Alto | Bajo |
| 3 | Employee: sección hoy + filtros (Gap 2) | Alto | Medio |
| 4 | Horarios: vista semanal grid (Gap 4a) | Medio | Medio |
| 5 | Servicios: stats + íconos (Gap 3) | Medio | Bajo |
| 6 | Usuarios: stats + panel detalle (Gap 6) | Medio | Medio |
| 7 | Negocio: master-detail (Gap 5) | Medio | Medio |
| 8 | Calendario: panel lateral desktop (Gap 1d) | Medio | Medio |
| 9 | Home: secciones faltantes (Gap 7) | Bajo | Alto |

---

## Archivos de referencia visual en este paquete

| Archivo HTML | Pantallas de referencia |
|---|---|
| `Shift Management.html` | Admin dashboard, Employee dashboard, Client dashboard, Login |
| `Shift Admin Screens.html` | Servicios, Horarios, Negocio, Usuarios |
| `Shift Calendar.html` | Calendario con panel lateral, línea ahora, vista día/semana |
| `Shift Home Page.html` | Landing completa con todas las secciones |
| `Shift Mobile.html` | Vistas mobile iOS |

**Para abrir:** estos archivos son HTML independientes, se abren directamente en el browser. Usarlos como referencia visual lado a lado mientras implementás.
