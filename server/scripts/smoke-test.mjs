#!/usr/bin/env node
/**
 * Smoke tests contra una API desplegada (por defecto, producción).
 *
 *   node scripts/smoke-test.mjs                       # producción
 *   BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
 *
 * Variables opcionales: BASE_URL, ORIGIN (frontend permitido por CORS),
 * DEMO_PASSWORD y los emails ADMIN_EMAIL, ADMIN2_EMAIL, EMPLOYEE_EMAIL, CLIENT_EMAIL.
 *
 * Usa las cuentas demo del seed. Todo lo que crea (una reserva) lo borra al
 * final. El test de rate limit va último porque bloquea el login desde esta
 * IP durante ~1 minuto.
 */

const BASE = (
  process.env.BASE_URL ?? 'https://shift-management-1-n8hg.onrender.com'
).replace(/\/$/, '');
const ORIGIN =
  process.env.ORIGIN ?? 'https://shift-management-livid.vercel.app';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'password123';
const EMAILS = {
  admin: process.env.ADMIN_EMAIL ?? 'admin1@test.com',
  admin2: process.env.ADMIN2_EMAIL ?? 'admin2@test.com',
  employee: process.env.EMPLOYEE_EMAIL ?? 'employee1@test.com',
  client: process.env.CLIENT_EMAIL ?? 'client1@test.com',
};

// ── Mini framework ────────────────────────────────────────────────────────
const results = [];
let section = '';
const describe = (name) => {
  section = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
};

async function api(method, path, { token, body, headers = {} } = {}) {
  const started = Date.now();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return {
    status: res.status,
    body: json,
    headers: res.headers,
    ms: Date.now() - started,
  };
}

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ section, name, ok: true });
    console.log(
      `  \x1b[32m✔\x1b[0m ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ''}`,
    );
  } catch (err) {
    results.push({ section, name, ok: false, error: err.message });
    console.log(`  \x1b[31m✘ ${name}\n      ${err.message}\x1b[0m`);
  }
}

function expectStatus(res, expected) {
  const ok = Array.isArray(expected)
    ? expected.includes(res.status)
    : res.status === expected;
  if (!ok) {
    const msg =
      typeof res.body === 'object'
        ? JSON.stringify(res.body).slice(0, 200)
        : String(res.body).slice(0, 200);
    throw new Error(
      `esperado HTTP ${expected}, recibido ${res.status}: ${msg}`,
    );
  }
  return `HTTP ${res.status} · ${res.ms} ms`;
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Convierte "fecha local + HH:MM en una zona IANA" a un Date UTC
function zonedTimeToUtc(y, m, d, hh, mm, timeZone) {
  const guess = Date.UTC(y, m, d, hh, mm);
  const asLocal = new Date(
    new Date(guess).toLocaleString('en-US', { timeZone }),
  );
  const asUtc = new Date(
    new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' }),
  );
  return new Date(guess - (asLocal - asUtc));
}

// ── Pruebas ───────────────────────────────────────────────────────────────
const tokens = {};
const cleanup = [];

console.log(`Smoke tests contra ${BASE}`);

describe('1. Disponibilidad');
await check(
  'GET /health responde (despierta el servicio si estaba dormido)',
  async () => {
    const res = await api('GET', '/health');
    expect(res.body.status === 'ok', 'status distinto de ok');
    return `${expectStatus(res, 200)} · uptime ${res.body.uptimeSeconds}s`;
  },
);
await check('GET /health/db consulta la base (SELECT 1)', async () => {
  const res = await api('GET', '/health/db');
  expect(res.body.database === 'up', 'database distinto de up');
  return `${expectStatus(res, 200)} · latencia DB ${res.body.latencyMs} ms`;
});

describe('2. Autenticación: consultas bien hechas');
for (const [role, email] of Object.entries(EMAILS)) {
  await check(`login ${role} (${email})`, async () => {
    const res = await api('POST', '/auth/login', {
      body: { email, password: PASSWORD },
    });
    const s = expectStatus(res, 200);
    expect(res.body.accessToken, 'no devolvió accessToken');
    expect(!('password' in res.body.user), 'la respuesta incluye password');
    tokens[role] = res.body.accessToken;
    return s;
  });
}
await check('login normaliza el email (mayúsculas y espacios)', async () => {
  const res = await api('POST', '/auth/login', {
    body: { email: `  ${EMAILS.client.toUpperCase()} `, password: PASSWORD },
  });
  return expectStatus(res, 200);
});

describe('3. Autenticación: errores');
await check('400 email con formato inválido', async () =>
  expectStatus(
    await api('POST', '/auth/login', {
      body: { email: 'no-es-un-email', password: PASSWORD },
    }),
    400,
  ),
);
await check('400 body vacío', async () =>
  expectStatus(await api('POST', '/auth/login', { body: {} }), 400),
);
await check(
  '401 contraseña incorrecta y email inexistente devuelven el MISMO mensaje',
  async () => {
    const wrong = await api('POST', '/auth/login', {
      body: { email: EMAILS.admin, password: 'incorrecta' },
    });
    const unknown = await api('POST', '/auth/login', {
      body: { email: `nadie${Date.now()}@test.com`, password: PASSWORD },
    });
    expectStatus(wrong, 401);
    expectStatus(unknown, 401);
    expect(
      wrong.body.message === unknown.body.message,
      `mensajes distintos: "${wrong.body.message}" vs "${unknown.body.message}"`,
    );
    return `ambos 401 "${wrong.body.message}"`;
  },
);
await check('400 registro con authProvider (no hay login social)', async () =>
  expectStatus(
    await api('POST', '/auth/register', {
      body: {
        name: 'X',
        email: `x${Date.now()}@test.com`,
        authProvider: 'GOOGLE',
      },
    }),
    400,
  ),
);
await check('400 registro con contraseña corta', async () =>
  expectStatus(
    await api('POST', '/auth/register', {
      body: { name: 'X', email: `x${Date.now()}@test.com`, password: '123' },
    }),
    400,
  ),
);
await check('409 registro con email ya existente', async () =>
  expectStatus(
    await api('POST', '/auth/register', {
      body: { name: 'X', email: EMAILS.client, password: 'secret123' },
    }),
    409,
  ),
);

describe('4. Tokens y permisos: errores');
await check('401 sin token', async () =>
  expectStatus(await api('GET', '/admin/me'), 401),
);
await check('401 token mal formado', async () =>
  expectStatus(await api('GET', '/admin/me', { token: 'no.es.un.jwt' }), 401),
);
await check('401 token con firma falsificada', async () => {
  const [h, p] = tokens.admin.split('.');
  return expectStatus(
    await api('GET', '/admin/me', { token: `${h}.${p}.firmafalsa` }),
    401,
  );
});
await check('401 token con alg "none"', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const payload = JSON.parse(
    Buffer.from(tokens.admin.split('.')[1], 'base64url').toString(),
  );
  return expectStatus(
    await api('GET', '/admin/me', {
      token: `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`,
    }),
    401,
  );
});
await check('403 un CLIENT no accede a rutas de ADMIN', async () =>
  expectStatus(await api('GET', '/admin/me', { token: tokens.client }), 403),
);
await check('403 un EMPLOYEE no lista todas las reservas', async () =>
  expectStatus(await api('GET', '/bookings', { token: tokens.employee }), 403),
);
await check(
  '403 un admin no puede editar el perfil de otro usuario',
  async () => {
    const other = await api('GET', '/admin/me', { token: tokens.admin2 });
    return expectStatus(
      await api('PUT', `/admin/${other.body.id}`, {
        token: tokens.admin,
        body: { name: 'hack' },
      }),
      403,
    );
  },
);
await check(
  '400 un admin no puede cambiarse el rol (campo no permitido)',
  async () => {
    const me = await api('GET', '/admin/me', { token: tokens.admin });
    return expectStatus(
      await api('PUT', `/admin/${me.body.id}`, {
        token: tokens.admin,
        body: { role: 'CLIENT' },
      }),
      400,
    );
  },
);

describe('5. Consultas bien hechas por rol');
let business, services, schedules;
await check('ADMIN: GET /admin/me (sin hash de contraseña)', async () => {
  const res = await api('GET', '/admin/me', { token: tokens.admin });
  expect(!('password' in res.body), 'incluye password');
  business = res.body.businesses?.[0];
  expect(business, 'el admin no tiene negocios');
  return `${expectStatus(res, 200)} · negocio "${business.name}" (${business.timezone})`;
});
await check(
  'ADMIN: GET /services/:businessId (precios como number)',
  async () => {
    const res = await api('GET', `/services/${business.id}`, {
      token: tokens.admin,
    });
    services = res.body;
    expect(services.length > 0, 'sin servicios');
    expect(
      services.every((s) => typeof s.price === 'number'),
      'algún precio no es number',
    );
    return `${expectStatus(res, 200)} · ${services.length} servicios`;
  },
);
await check('ADMIN: GET /schedules', async () => {
  const res = await api('GET', '/schedules', { token: tokens.admin });
  schedules = res.body.filter((s) => s.businessId === business.id);
  expect(schedules.length > 0, 'sin horarios');
  return `${expectStatus(res, 200)} · ${schedules.length} horarios`;
});
await check('ADMIN: GET /admin/metrics (ingresos como number)', async () => {
  const year = new Date().getFullYear();
  const res = await api(
    'GET',
    `/admin/metrics?businessId=${business.id}&from=${year}-01-01&to=${year}-12-31&groupBy=month`,
    { token: tokens.admin },
  );
  expect(
    typeof res.body.totalRevenue === 'number',
    'totalRevenue no es number',
  );
  return `${expectStatus(res, 200)} · ${res.body.totalBookings} reservas · ingresos ${res.body.totalRevenue}`;
});
await check('ADMIN: GET /bookings?limit=5 (solo su negocio)', async () => {
  const res = await api('GET', `/bookings?businessId=${business.id}&limit=5`, {
    token: tokens.admin,
  });
  expect(res.body.length <= 5, 'devolvió más de 5');
  return `${expectStatus(res, 200)} · ${res.body.length} reservas`;
});
await check('EMPLOYEE: GET /bookings/my-assignments', async () =>
  expectStatus(
    await api('GET', '/bookings/my-assignments', { token: tokens.employee }),
    200,
  ),
);
await check(
  'EMPLOYEE: GET /users/search?email=client (solo id, name, email, phone)',
  async () => {
    const res = await api('GET', '/users/search?email=client', {
      token: tokens.employee,
    });
    const s = expectStatus(res, 200);
    expect(
      res.body.every(
        (u) => Object.keys(u).sort().join() === 'email,id,name,phone',
      ),
      'devuelve campos de más',
    );
    return `${s} · ${res.body.length} clientes`;
  },
);
await check('CLIENT: GET /bookings/my-bookings', async () =>
  expectStatus(
    await api('GET', '/bookings/my-bookings', { token: tokens.client }),
    200,
  ),
);
await check('PÚBLICO: GET /business/public', async () =>
  expectStatus(await api('GET', '/business/public'), 200),
);

describe('6. Reservas: validación y errores');
const service = services?.[0];
const futureIso = new Date(Date.now() + 30 * 24 * 3600e3).toISOString();
await check('400 campo desconocido en el body', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.client,
      body: {
        serviceId: service.id,
        businessId: business.id,
        date: futureIso,
        hack: true,
      },
    }),
    400,
  ),
);
await check('400 serviceId que no es UUID', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.client,
      body: { serviceId: 'abc', businessId: business.id, date: futureIso },
    }),
    400,
  ),
);
await check('400 fecha con formato inválido', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.client,
      body: { serviceId: service.id, businessId: business.id, date: 'mañana' },
    }),
    400,
  ),
);
await check('400 fecha en el pasado', async () => {
  const res = await api('POST', '/bookings', {
    token: tokens.client,
    body: {
      serviceId: service.id,
      businessId: business.id,
      date: '2020-01-01T10:00:00.000Z',
    },
  });
  return `${expectStatus(res, 400)} · "${res.body.message}"`;
});
await check('400 negocio inexistente', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.client,
      body: {
        serviceId: service.id,
        businessId: '00000000-0000-4000-8000-000000000000',
        date: futureIso,
      },
    }),
    400,
  ),
);
await check('403 un admin no puede reservar en un negocio ajeno', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.admin2,
      body: { serviceId: service.id, businessId: business.id, date: futureIso },
    }),
    403,
  ),
);
await check('404 cambiar el estado de una reserva inexistente', async () =>
  expectStatus(
    await api(
      'PATCH',
      '/bookings/00000000-0000-4000-8000-000000000000/status',
      { token: tokens.admin, body: { status: 'CONFIRMED' } },
    ),
    404,
  ),
);
await check('400 estado inválido', async () =>
  expectStatus(
    await api(
      'PATCH',
      '/bookings/00000000-0000-4000-8000-000000000000/status',
      { token: tokens.admin, body: { status: 'HACKED' } },
    ),
    400,
  ),
);

describe('7. Reservas: flujo completo bien hecho');
let booking;
await check(
  'CLIENT crea una reserva (busca un hueco libre en el horario del negocio)',
  async () => {
    const tz = business.timezone ?? 'Europe/Madrid';
    for (let dayOffset = 14; dayOffset < 45 && !booking; dayOffset++) {
      const day = new Date(Date.now() + dayOffset * 24 * 3600e3);
      const local = new Date(day.toLocaleString('en-US', { timeZone: tz }));
      const schedule = schedules.find((s) => s.dayOfWeek === local.getDay());
      if (!schedule) continue;
      const [fh, fm] = schedule.from.split(':').map(Number);
      for (let extra = 60; extra <= 180 && !booking; extra += 30) {
        const total = fh * 60 + fm + extra;
        const date = zonedTimeToUtc(
          local.getFullYear(),
          local.getMonth(),
          local.getDate(),
          Math.floor(total / 60),
          total % 60,
          tz,
        );
        const res = await api('POST', '/bookings', {
          token: tokens.client,
          body: {
            serviceId: service.id,
            businessId: business.id,
            date: date.toISOString(),
            finalPrice: 1,
            timezone: 'Pacific/Kiritimati',
          },
        });
        if (res.status === 201) booking = res.body;
        else if (res.status !== 400) expectStatus(res, 201);
      }
    }
    expect(booking, 'no se encontró ningún hueco libre');
    cleanup.push(booking.id);
    return `HTTP 201 · ${booking.date} · empleado ${booking.employee?.name}`;
  },
);
await check(
  'el precio lo pone el servidor (se ignoró finalPrice: 1)',
  async () => {
    expect(
      booking.finalPrice === service.price,
      `finalPrice ${booking.finalPrice} ≠ precio del servicio ${service.price}`,
    );
    return `finalPrice ${booking.finalPrice} = precio del servicio`;
  },
);
await check(
  'la zona horaria es la del negocio (se ignoró la del body)',
  async () => {
    expect(
      booking.timezone === business.timezone,
      `timezone ${booking.timezone}`,
    );
    return booking.timezone;
  },
);
await check('400 el mismo hueco ya no está disponible', async () =>
  expectStatus(
    await api('POST', '/bookings', {
      token: tokens.client,
      body: {
        serviceId: service.id,
        businessId: business.id,
        employeeId: booking.employeeId,
        date: booking.date,
      },
    }),
    400,
  ),
);
await check(
  '403 el CLIENT no puede editar precio ni datos de su reserva',
  async () =>
    expectStatus(
      await api('PUT', `/bookings/${booking.id}`, {
        token: tokens.client,
        body: { finalPrice: 0 },
      }),
      403,
    ),
);
await check('403 el CLIENT no puede confirmar su reserva', async () =>
  expectStatus(
    await api('PATCH', `/bookings/${booking.id}/status`, {
      token: tokens.client,
      body: { status: 'CONFIRMED' },
    }),
    403,
  ),
);
await check('403 un admin de otro negocio no puede tocarla', async () =>
  expectStatus(
    await api('PATCH', `/bookings/${booking.id}/status`, {
      token: tokens.admin2,
      body: { status: 'COMPLETED' },
    }),
    403,
  ),
);
await check('ADMIN dueño la confirma', async () => {
  const res = await api('PATCH', `/bookings/${booking.id}/status`, {
    token: tokens.admin,
    body: { status: 'CONFIRMED' },
  });
  expect(res.body.status === 'CONFIRMED', `estado ${res.body.status}`);
  return expectStatus(res, 200);
});
await check('CLIENT la cancela', async () => {
  const res = await api('PATCH', `/bookings/${booking.id}/status`, {
    token: tokens.client,
    body: { status: 'CANCELLED' },
  });
  expect(res.body.status === 'CANCELLED', `estado ${res.body.status}`);
  return expectStatus(res, 200);
});

describe('8. Horarios: errores');
await check('400 horario con formato inválido', async () =>
  expectStatus(
    await api('POST', '/schedules', {
      token: tokens.admin,
      body: { dayOfWeek: 9, from: 'abc', to: '10:00', businessId: business.id },
    }),
    400,
  ),
);
await check('403 horario en un negocio ajeno', async () => {
  const other = await api('GET', '/admin/me', { token: tokens.admin2 });
  return expectStatus(
    await api('POST', '/schedules', {
      token: tokens.admin,
      body: {
        dayOfWeek: 1,
        from: '09:00',
        to: '10:00',
        businessId: other.body.businesses[0].id,
      },
    }),
    403,
  );
});

describe('9. Configuración de producción');
await check('404 Swagger desactivado en producción', async () =>
  expectStatus(await api('GET', '/api'), 404),
);
await check('404 ruta inexistente', async () =>
  expectStatus(await api('GET', '/no-existe'), 404),
);
await check('CORS permite el frontend', async () => {
  const res = await api('OPTIONS', '/auth/login', {
    headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' },
  });
  expect(
    res.headers.get('access-control-allow-origin') === ORIGIN,
    `allow-origin = ${res.headers.get('access-control-allow-origin')}`,
  );
  return `allow-origin ${ORIGIN}`;
});
await check('CORS rechaza un origen desconocido', async () => {
  const res = await api('OPTIONS', '/auth/login', {
    headers: {
      Origin: 'https://sitio-malicioso.example',
      'Access-Control-Request-Method': 'POST',
    },
  });
  expect(
    !res.headers.get('access-control-allow-origin'),
    `allow-origin = ${res.headers.get('access-control-allow-origin')}`,
  );
  return 'sin Access-Control-Allow-Origin';
});
await check('cabeceras de seguridad (helmet)', async () => {
  const res = await api('GET', '/health');
  const missing = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
  ].filter((h) => !res.headers.get(h));
  expect(!missing.length, `faltan: ${missing.join(', ')}`);
  expect(!res.headers.get('x-powered-by'), 'expone x-powered-by');
  return 'HSTS, nosniff, X-Frame-Options; sin X-Powered-By';
});

// ── Limpieza ──────────────────────────────────────────────────────────────
describe('10. Limpieza');
for (const id of cleanup) {
  await check(`borra la reserva de prueba ${id.slice(0, 8)}…`, async () =>
    expectStatus(
      await api('DELETE', `/bookings/${id}`, { token: tokens.admin }),
      200,
    ),
  );
}

describe(
  '11. Rate limiting (último: bloquea el login ~1 minuto desde esta IP)',
);
await check('429 tras 10 intentos de login por minuto', async () => {
  const codes = [];
  for (let i = 0; i < 12; i++) {
    codes.push(
      (
        await api('POST', '/auth/login', {
          body: { email: 'fuerza@bruta.com', password: 'xxxxxxx' },
        })
      ).status,
    );
  }
  expect(codes.includes(429), `nunca devolvió 429: ${codes.join(' ')}`);
  return codes.join(' ');
});

// ── Resumen ───────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log(
  `\n\x1b[1m${results.length - failed.length}/${results.length} pruebas OK\x1b[0m`,
);
if (failed.length) {
  console.log('\nFallaron:');
  for (const f of failed)
    console.log(`  - [${f.section}] ${f.name}: ${f.error}`);
  process.exit(1);
}
