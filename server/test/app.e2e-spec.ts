/**
 * Tests e2e contra una base PostgreSQL real (la que indique DATABASE_URL),
 * cargada con `npx prisma db seed`. Cubren los fallos de seguridad corregidos
 * en la auditoría para que no puedan volver sin que el CI lo detecte.
 *
 * Ejecutar: DATABASE_URL=... DIRECT_URL=... JWT_SECRET=... npm run test:e2e
 */
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../prisma/prisma.service';

describe('API (e2e)', () => {
  let app: NestExpressApplication;
  let http: App;
  let prisma: PrismaService;
  const tokens: Record<string, string> = {};

  const login = async (email: string) => {
    const res = await request(http)
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };
  const auth = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

  // Próxima fecha (>= 7 días) en el día de la semana indicado, a las 10:00 UTC
  const futureDateOn = (dayOfWeek: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 7);
    while (d.getUTCDay() !== dayOfWeek) d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(10, 0, 0, 0);
    return d;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    http = app.getHttpServer() as App;
    prisma = app.get(PrismaService);

    // Menos de 10 logins: el límite de /auth/login es 10 por minuto e IP
    tokens.admin1 = await login('admin1@test.com');
    tokens.admin2 = await login('admin2@test.com');
    tokens.client1 = await login('client1@test.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde', () => request(http).get('/health').expect(200));

  describe('auth', () => {
    it('responde el mismo 401 genérico para email inexistente y contraseña incorrecta', async () => {
      const unknown = await request(http)
        .post('/auth/login')
        .send({ email: 'nadie@test.com', password: 'password123' });
      const wrong = await request(http)
        .post('/auth/login')
        .send({ email: 'admin1@test.com', password: 'incorrecta' });
      expect(unknown.status).toBe(401);
      expect(wrong.status).toBe(401);
      expect(unknown.body.message).toBe(wrong.body.message);
    });

    it('rechaza registrar cuentas con authProvider (no hay login social)', () =>
      request(http)
        .post('/auth/register')
        .send({ name: 'X', email: 'squat@test.com', authProvider: 'GOOGLE' })
        .expect(400));
  });

  describe('usuarios', () => {
    it('nunca devuelve el hash de la contraseña', async () => {
      const res = await request(http)
        .get('/admin/me')
        .set(auth('admin1'))
        .expect(200);
      expect(res.body).not.toHaveProperty('password');
    });

    it('un admin no puede modificar a otro usuario', async () => {
      const other = await prisma.user.findUniqueOrThrow({
        where: { email: 'admin2@test.com' },
      });
      await request(http)
        .put(`/admin/${other.id}`)
        .set(auth('admin1'))
        .send({ email: 'hacked@x.com' })
        .expect(403);
      const after = await prisma.user.findUniqueOrThrow({
        where: { id: other.id },
      });
      expect(after.email).toBe('admin2@test.com');
    });

    it('un token deja de valer cuando el usuario se borra', async () => {
      const tmp = await prisma.user.create({
        data: {
          name: 'Tmp',
          email: `tmp-${Date.now()}@test.com`,
          role: 'ADMIN',
          password: (
            await prisma.user.findUniqueOrThrow({
              where: { email: 'admin1@test.com' },
              omit: { password: false },
            })
          ).password,
        },
      });
      const token = await login(tmp.email);
      await request(http)
        .get('/admin/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200);
      await prisma.user.delete({ where: { id: tmp.id } });
      await request(http)
        .get('/admin/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(401);
    });
  });

  describe('reservas', () => {
    let businessId: string;
    let serviceId: string;
    let servicePrice: number;
    let employeeId: string;
    let date: Date;

    beforeAll(async () => {
      const business = await prisma.business.findFirstOrThrow({
        where: { owner: { email: 'admin1@test.com' } },
        include: { services: true, employees: true, schedules: true },
      });
      businessId = business.id;
      serviceId = business.services[0].id;
      servicePrice = business.services[0].price.toNumber();
      employeeId = business.employees.find((e) => e.role === 'EMPLOYEE')!.id;
      const open = business.schedules.find(
        (s) => s.from <= '10:00' && s.to >= '13:00',
      )!;
      date = futureDateOn(open.dayOfWeek);
    });

    it('valida el body (rechaza campos desconocidos)', () =>
      request(http)
        .post('/bookings')
        .set(auth('client1'))
        .send({ serviceId, businessId, date: date.toISOString(), hack: true })
        .expect(400));

    it('rechaza fechas pasadas', () =>
      request(http)
        .post('/bookings')
        .set(auth('client1'))
        .send({ serviceId, businessId, date: '2020-01-01T10:00:00Z' })
        .expect(400));

    it('un admin no puede reservar en un negocio ajeno', () =>
      request(http)
        .post('/bookings')
        .set(auth('admin2'))
        .send({ serviceId, businessId, date: date.toISOString() })
        .expect(403));

    it('no permite reservar dos veces el mismo hueco aunque los pedidos sean simultáneos', async () => {
      const slot = new Date(date.getTime() + 60 * 60 * 1000); // 1 h más tarde que el resto de tests
      // Idempotente: libera el hueco por si quedó ocupado de una ejecución anterior
      await prisma.booking.deleteMany({ where: { employeeId, date: slot } });
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(http).post('/bookings').set(auth('client1')).send({
            serviceId,
            businessId,
            employeeId,
            date: slot.toISOString(),
          }),
        ),
      );
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 400)).toHaveLength(4);
    });

    describe('con una reserva creada', () => {
      let bookingId: string;

      beforeAll(async () => {
        const res = await request(http)
          .post('/bookings')
          .set(auth('client1'))
          .send({
            serviceId,
            businessId,
            date: date.toISOString(),
            finalPrice: 1,
            timezone: 'Pacific/Kiritimati',
          })
          .expect(201);
        bookingId = res.body.id;
        // Precio del servicio (no el del body) y como number (DECIMAL -> number)
        expect(res.body.finalPrice).toBe(servicePrice);
        expect(res.body.timezone).toBe('Europe/Madrid');
      });

      it('el cliente no puede editar su reserva (precio, estado...)', () =>
        request(http)
          .put(`/bookings/${bookingId}`)
          .set(auth('client1'))
          .send({ finalPrice: 0 })
          .expect(403));

      it('el cliente no puede confirmar su reserva', () =>
        request(http)
          .patch(`/bookings/${bookingId}/status`)
          .set(auth('client1'))
          .send({ status: 'CONFIRMED' })
          .expect(403));

      it('un admin no puede cambiar reservas de otro negocio', () =>
        request(http)
          .patch(`/bookings/${bookingId}/status`)
          .set(auth('admin2'))
          .send({ status: 'COMPLETED' })
          .expect(403));

      it('el cliente sí puede cancelarla', async () => {
        const res = await request(http)
          .patch(`/bookings/${bookingId}/status`)
          .set(auth('client1'))
          .send({ status: 'CANCELLED' })
          .expect(200);
        expect(res.body.status).toBe('CANCELLED');
      });
    });
  });

  describe('horarios', () => {
    it('un admin no puede crear horarios en un negocio ajeno', async () => {
      const foreign = await prisma.business.findFirstOrThrow({
        where: { owner: { email: 'admin2@test.com' } },
      });
      await request(http)
        .post('/schedules')
        .set(auth('admin1'))
        .send({
          dayOfWeek: 1,
          from: '09:00',
          to: '10:00',
          businessId: foreign.id,
        })
        .expect(403);
    });
  });
});
