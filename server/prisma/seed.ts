import {
  PrismaClient,
  Role,
  AuthProvider,
  BookingStatus,
  PaymentStatus,
  CashMovementType,
  PaymentMethod,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function d(daysOffset: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed cannot be run in production environment');
    process.exit(1);
  }

  console.log('🌱 Starting seed...');

  await prisma.cashMovement.deleteMany();
  await prisma.cashClosing.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── ADMINS ───────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const admin1 = await prisma.user.create({
    data: {
      name: 'Admin Principal',
      email: 'admin1@test.com',
      password: hashedPassword,
      phone: '+54 11 1234-5678',
      role: Role.ADMIN,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Admin Secundario',
      email: 'admin2@test.com',
      password: hashedPassword,
      phone: '+54 11 8765-4321',
      role: Role.ADMIN,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const admin3 = await prisma.user.create({
    data: {
      name: 'Admin Terciario',
      email: 'admin3@test.com',
      password: hashedPassword,
      phone: '+54 11 5544-3322',
      role: Role.ADMIN,
      authProvider: AuthProvider.LOCAL,
    },
  });

  // ─── CLIENTS ──────────────────────────────────────────────────────────────
  const client1 = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      email: 'client1@test.com',
      password: hashedPassword,
      phone: '+54 11 2222-3333',
      role: Role.CLIENT,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'María García',
      email: 'client2@test.com',
      password: hashedPassword,
      phone: '+54 11 4444-5555',
      role: Role.CLIENT,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const client3 = await prisma.user.create({
    data: {
      name: 'Carlos López',
      email: 'client3@test.com',
      password: hashedPassword,
      phone: '+54 11 6666-7777',
      role: Role.CLIENT,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const client4 = await prisma.user.create({
    data: {
      name: 'Valentina Torres',
      email: 'client4@test.com',
      password: hashedPassword,
      phone: '+54 11 8888-1111',
      role: Role.CLIENT,
      authProvider: AuthProvider.LOCAL,
    },
  });

  const client5 = await prisma.user.create({
    data: {
      name: 'Sebastián Molina',
      email: 'client5@test.com',
      password: hashedPassword,
      phone: '+54 11 3333-9999',
      role: Role.CLIENT,
      authProvider: AuthProvider.LOCAL,
    },
  });

  console.log('✅ Created 8 users (3 admins, 5 clients) — employees coming after businesses');

  // ─── BUSINESSES ───────────────────────────────────────────────────────────
  console.log('🏢 Creating businesses...');

  const barberia = await prisma.business.create({
    data: { name: 'Barbería Central', ownerId: admin1.id },
  });

  const spa = await prisma.business.create({
    data: { name: 'Spa Relax', ownerId: admin1.id },
  });

  const salon = await prisma.business.create({
    data: { name: 'Salón de Belleza Elite', ownerId: admin2.id },
  });

  const clinica = await prisma.business.create({
    data: { name: 'Clínica de Estética Derm+', ownerId: admin2.id },
  });

  const gimnasio = await prisma.business.create({
    data: { name: 'Gimnasio FitLife', ownerId: admin3.id },
  });

  const veterinaria = await prisma.business.create({
    data: { name: 'Veterinaria PetCare', ownerId: admin3.id },
  });

  console.log('✅ Created 6 businesses');

  // ─── EMPLOYEES ────────────────────────────────────────────────────────────
  console.log('👨‍💼 Creating employees...');

  const employee1 = await prisma.user.create({
    data: {
      name: 'Pedro Barbero',
      email: 'employee1@test.com',
      password: hashedPassword,
      phone: '+54 11 3333-4444',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: barberia.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Diego Estilista',
      email: 'employee2@test.com',
      password: hashedPassword,
      phone: '+54 11 4444-2222',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: barberia.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'Laura Masajista',
      email: 'employee3@test.com',
      password: hashedPassword,
      phone: '+54 11 5555-6666',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: spa.id,
    },
  });

  const employee4 = await prisma.user.create({
    data: {
      name: 'Sofía Spa',
      email: 'employee4@test.com',
      password: hashedPassword,
      phone: '+54 11 6655-7788',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: spa.id,
    },
  });

  const employee5 = await prisma.user.create({
    data: {
      name: 'Ana Estilista',
      email: 'employee5@test.com',
      password: hashedPassword,
      phone: '+54 11 7777-8888',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: salon.id,
    },
  });

  const employee6 = await prisma.user.create({
    data: {
      name: 'Lucía Dermatologa',
      email: 'employee6@test.com',
      password: hashedPassword,
      phone: '+54 11 9900-1122',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: clinica.id,
    },
  });

  const employee7 = await prisma.user.create({
    data: {
      name: 'Marcos Entrenador',
      email: 'employee7@test.com',
      password: hashedPassword,
      phone: '+54 11 1122-3344',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: gimnasio.id,
    },
  });

  const employee8 = await prisma.user.create({
    data: {
      name: 'Camila Veterinaria',
      email: 'employee8@test.com',
      password: hashedPassword,
      phone: '+54 11 2233-4455',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: veterinaria.id,
    },
  });

  console.log('✅ Created 8 employees');

  // ─── SERVICES ─────────────────────────────────────────────────────────────
  console.log('💇 Creating services...');

  // Barbería
  const corteCabello = await prisma.service.create({
    data: { name: 'Corte de Cabello', description: 'Corte profesional con estilo moderno', durationMin: 30, price: 5000, businessId: barberia.id },
  });
  const afeitado = await prisma.service.create({
    data: { name: 'Afeitado Clásico', description: 'Afeitado tradicional con navaja', durationMin: 20, price: 3000, businessId: barberia.id },
  });
  const tinte = await prisma.service.create({
    data: { name: 'Tinte de Cabello', description: 'Coloración completa del cabello', durationMin: 90, price: 8000, businessId: barberia.id },
  });
  const corteBarba = await prisma.service.create({
    data: { name: 'Corte y Barba', description: 'Corte de cabello + perfilado de barba', durationMin: 45, price: 7000, businessId: barberia.id },
  });

  // Spa
  const masajeRelax = await prisma.service.create({
    data: { name: 'Masaje Relajante', description: 'Masaje de cuerpo completo para relajación', durationMin: 60, price: 12000, businessId: spa.id },
  });
  const facialLimpieza = await prisma.service.create({
    data: { name: 'Limpieza Facial', description: 'Tratamiento de limpieza profunda facial', durationMin: 45, price: 7000, businessId: spa.id },
  });
  const masajePiedras = await prisma.service.create({
    data: { name: 'Masaje con Piedras Calientes', description: 'Masaje terapéutico con piedras volcánicas', durationMin: 75, price: 15000, businessId: spa.id },
  });
  const aromaterapia = await prisma.service.create({
    data: { name: 'Aromaterapia', description: 'Sesión de relajación con aceites esenciales', durationMin: 50, price: 9500, businessId: spa.id },
  });

  // Salón
  const manicura = await prisma.service.create({
    data: { name: 'Manicura Completa', description: 'Manicura con esmaltado permanente', durationMin: 45, price: 4500, businessId: salon.id },
  });
  const pedicura = await prisma.service.create({
    data: { name: 'Pedicura Spa', description: 'Pedicura con tratamiento hidratante', durationMin: 60, price: 5500, businessId: salon.id },
  });
  const peinado = await prisma.service.create({
    data: { name: 'Peinado de Fiesta', description: 'Peinado profesional para eventos', durationMin: 50, price: 6000, businessId: salon.id },
  });

  // Clínica de Estética
  const botox = await prisma.service.create({
    data: { name: 'Aplicación de Botox', description: 'Relleno con ácido hialurónico', durationMin: 40, price: 35000, businessId: clinica.id },
  });
  const limpiezaProfunda = await prisma.service.create({
    data: { name: 'Limpieza Profunda Premium', description: 'Limpieza facial con ultrasonido y extracción', durationMin: 60, price: 15000, businessId: clinica.id },
  });
  const depilacionLaser = await prisma.service.create({
    data: { name: 'Depilación Láser', description: 'Depilación permanente con tecnología diodo', durationMin: 45, price: 20000, businessId: clinica.id },
  });

  // Gimnasio
  const claseYoga = await prisma.service.create({
    data: { name: 'Clase de Yoga', description: 'Sesión grupal de yoga para todos los niveles', durationMin: 60, price: 3500, businessId: gimnasio.id },
  });
  const entrenamientoPersonal = await prisma.service.create({
    data: { name: 'Entrenamiento Personal', description: 'Sesión 1 a 1 con entrenador certificado', durationMin: 60, price: 8000, businessId: gimnasio.id },
  });
  const pilates = await prisma.service.create({
    data: { name: 'Pilates Reformer', description: 'Clase de pilates en máquina reformer', durationMin: 50, price: 5000, businessId: gimnasio.id },
  });

  // Veterinaria
  const consultaGeneral = await prisma.service.create({
    data: { name: 'Consulta General', description: 'Revisión clínica completa de la mascota', durationMin: 30, price: 6000, businessId: veterinaria.id },
  });
  const vacunacion = await prisma.service.create({
    data: { name: 'Vacunación', description: 'Aplicación de vacunas según calendario', durationMin: 20, price: 4000, businessId: veterinaria.id },
  });
  const bano = await prisma.service.create({
    data: { name: 'Baño y Peluquería', description: 'Baño completo con corte de pelo', durationMin: 90, price: 8500, businessId: veterinaria.id },
  });

  console.log('✅ Created 20 services');

  // ─── SCHEDULES ────────────────────────────────────────────────────────────
  console.log('📅 Creating schedules...');

  // Barbería: Lun-Vie 09-19, Sáb 10-14
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '09:00', to: '19:00', businessId: barberia.id } });
  }
  await prisma.schedule.create({ data: { dayOfWeek: 6, from: '10:00', to: '14:00', businessId: barberia.id } });

  // Spa: Lun-Sáb 10-20
  for (let day = 1; day <= 6; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '10:00', to: '20:00', businessId: spa.id } });
  }

  // Salón: Mar-Sáb 09:30-18:30
  for (let day = 2; day <= 6; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '09:30', to: '18:30', businessId: salon.id } });
  }

  // Clínica: Lun-Vie 08-17
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '08:00', to: '17:00', businessId: clinica.id } });
  }

  // Gimnasio: Lun-Dom 07-22
  for (let day = 0; day <= 6; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '07:00', to: '22:00', businessId: gimnasio.id } });
  }

  // Veterinaria: Lun-Sáb 09-18
  for (let day = 1; day <= 6; day++) {
    await prisma.schedule.create({ data: { dayOfWeek: day, from: '09:00', to: '18:00', businessId: veterinaria.id } });
  }

  console.log('✅ Created schedules for all businesses');

  // ─── BOOKINGS ─────────────────────────────────────────────────────────────
  // Legend: d(offset, hour) — offset from today in days (negative = past)
  console.log('📝 Creating bookings...');

  const TZ = 'America/Argentina/Buenos_Aires';

  // ── COMPLETED (past, paid) ─────────────────────────────────────────────
  await prisma.booking.createMany({
    data: [
      // Clientes habituales
      { userId: client1.id, serviceId: corteCabello.id, businessId: barberia.id, employeeId: employee1.id, date: d(-60, 10), endTime: d(-60, 10, 30), finalPrice: 5000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: client2.id, serviceId: masajeRelax.id, businessId: spa.id, employeeId: employee3.id, date: d(-55, 14), endTime: d(-55, 15), finalPrice: 12000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: client3.id, serviceId: manicura.id, businessId: salon.id, employeeId: employee5.id, date: d(-50, 11), endTime: d(-50, 11, 45), finalPrice: 4500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, timezone: TZ },
      { userId: client4.id, serviceId: botox.id, businessId: clinica.id, employeeId: employee6.id, date: d(-45, 9), endTime: d(-45, 9, 40), finalPrice: 35000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: client5.id, serviceId: entrenamientoPersonal.id, businessId: gimnasio.id, employeeId: employee7.id, date: d(-40, 8), endTime: d(-40, 9), finalPrice: 8000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: client1.id, serviceId: afeitado.id, businessId: barberia.id, employeeId: employee2.id, date: d(-35, 16), endTime: d(-35, 16, 20), finalPrice: 3000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: client2.id, serviceId: facialLimpieza.id, businessId: spa.id, employeeId: employee4.id, date: d(-30, 15, 30), endTime: d(-30, 16, 15), finalPrice: 7000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, timezone: TZ },
      { userId: client3.id, serviceId: pedicura.id, businessId: salon.id, employeeId: employee5.id, date: d(-28, 10), endTime: d(-28, 11), finalPrice: 5500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: client4.id, serviceId: consultaGeneral.id, businessId: veterinaria.id, employeeId: employee8.id, date: d(-25, 9), endTime: d(-25, 9, 30), finalPrice: 6000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: client5.id, serviceId: claseYoga.id, businessId: gimnasio.id, employeeId: employee7.id, date: d(-20, 7), endTime: d(-20, 8), finalPrice: 3500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      // Admin y employees como clientes
      { userId: admin1.id, serviceId: masajePiedras.id, businessId: spa.id, employeeId: employee3.id, date: d(-22, 17), endTime: d(-22, 18, 15), finalPrice: 15000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: admin2.id, serviceId: claseYoga.id, businessId: gimnasio.id, employeeId: employee7.id, date: d(-18, 8), endTime: d(-18, 9), finalPrice: 3500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: admin3.id, serviceId: corteCabello.id, businessId: barberia.id, employeeId: employee1.id, date: d(-15, 11), endTime: d(-15, 11, 30), finalPrice: 5000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: employee1.id, serviceId: masajeRelax.id, businessId: spa.id, employeeId: employee4.id, date: d(-14, 10), endTime: d(-14, 11), finalPrice: 12000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, timezone: TZ },
      { userId: employee3.id, serviceId: corteBarba.id, businessId: barberia.id, employeeId: employee2.id, date: d(-10, 16), endTime: d(-10, 16, 45), finalPrice: 7000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: employee5.id, serviceId: limpiezaProfunda.id, businessId: clinica.id, employeeId: employee6.id, date: d(-8, 9), endTime: d(-8, 10), finalPrice: 15000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: employee7.id, serviceId: vacunacion.id, businessId: veterinaria.id, employeeId: employee8.id, date: d(-7, 11), endTime: d(-7, 11, 20), finalPrice: 4000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },
      { userId: client1.id, serviceId: tinte.id, businessId: barberia.id, employeeId: employee1.id, date: d(-6, 14), endTime: d(-6, 15, 30), finalPrice: 8000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: client2.id, serviceId: aromaterapia.id, businessId: spa.id, employeeId: employee3.id, date: d(-5, 15), endTime: d(-5, 15, 50), finalPrice: 9500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, timezone: TZ },
      { userId: client3.id, serviceId: depilacionLaser.id, businessId: clinica.id, employeeId: employee6.id, date: d(-4, 10), endTime: d(-4, 10, 45), finalPrice: 20000, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: client4.id, serviceId: bano.id, businessId: veterinaria.id, employeeId: employee8.id, date: d(-3, 9), endTime: d(-3, 10, 30), finalPrice: 8500, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, timezone: TZ },

      // ── CONFIRMED (próximos días) ────────────────────────────────────────
      { userId: client5.id, serviceId: pilates.id, businessId: gimnasio.id, employeeId: employee7.id, date: d(1, 9), endTime: d(1, 9, 50), finalPrice: 5000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client1.id, serviceId: masajePiedras.id, businessId: spa.id, employeeId: employee3.id, date: d(1, 14), endTime: d(1, 15, 15), finalPrice: 15000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client2.id, serviceId: peinado.id, businessId: salon.id, employeeId: employee5.id, date: d(2, 12), endTime: d(2, 12, 50), finalPrice: 6000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: admin1.id, serviceId: depilacionLaser.id, businessId: clinica.id, employeeId: employee6.id, date: d(2, 15), endTime: d(2, 15, 45), finalPrice: 20000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CARD, timezone: TZ },
      { userId: employee2.id, serviceId: aromaterapia.id, businessId: spa.id, employeeId: employee4.id, date: d(3, 10), endTime: d(3, 10, 50), finalPrice: 9500, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client3.id, serviceId: entrenamientoPersonal.id, businessId: gimnasio.id, employeeId: employee7.id, date: d(3, 8), endTime: d(3, 9), finalPrice: 8000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, timezone: TZ },
      { userId: client4.id, serviceId: botox.id, businessId: clinica.id, employeeId: employee6.id, date: d(4, 9), endTime: d(4, 9, 40), finalPrice: 35000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: admin3.id, serviceId: masajeRelax.id, businessId: spa.id, employeeId: employee3.id, date: d(4, 17), endTime: d(4, 18), finalPrice: 12000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: employee6.id, serviceId: corteBarba.id, businessId: barberia.id, employeeId: employee1.id, date: d(5, 11), endTime: d(5, 11, 45), finalPrice: 7000, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },

      // ── PENDING (futuro) ─────────────────────────────────────────────────
      { userId: client5.id, serviceId: corteCabello.id, businessId: barberia.id, date: d(7, 11), endTime: d(7, 11, 30), finalPrice: 5000, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client1.id, serviceId: pedicura.id, businessId: salon.id, date: d(9, 15), endTime: d(9, 16), finalPrice: 5500, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client2.id, serviceId: consultaGeneral.id, businessId: veterinaria.id, date: d(10, 10), endTime: d(10, 10, 30), finalPrice: 6000, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: admin2.id, serviceId: entrenamientoPersonal.id, businessId: gimnasio.id, date: d(12, 8), endTime: d(12, 9), finalPrice: 8000, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: employee4.id, serviceId: corteCabello.id, businessId: barberia.id, date: d(14, 12), endTime: d(14, 12, 30), finalPrice: 5000, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, timezone: TZ },

      // ── CANCELLED ────────────────────────────────────────────────────────
      { userId: client3.id, serviceId: afeitado.id, businessId: barberia.id, employeeId: employee1.id, date: d(-33, 9), endTime: d(-33, 9, 20), finalPrice: 3000, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, timezone: TZ },
      { userId: client1.id, serviceId: manicura.id, businessId: salon.id, date: d(-12, 13), endTime: d(-12, 13, 45), finalPrice: 4500, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: client4.id, serviceId: pilates.id, businessId: gimnasio.id, date: d(-9, 18), endTime: d(-9, 18, 50), finalPrice: 5000, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, timezone: TZ },
      { userId: admin1.id, serviceId: vacunacion.id, businessId: veterinaria.id, date: d(6, 10), endTime: d(6, 10, 20), finalPrice: 4000, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.PENDING, timezone: TZ },
      { userId: employee8.id, serviceId: claseYoga.id, businessId: gimnasio.id, date: d(-2, 19), endTime: d(-2, 20), finalPrice: 3500, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, timezone: TZ },
    ],
  });

  console.log('✅ Created 40 bookings (COMPLETED / CONFIRMED / PENDING / CANCELLED)');

  // ─── CASH REGISTERS ───────────────────────────────────────────────────────
  console.log('💰 Creating cash registers...');

  // Helper to build a closed register
  async function createClosedRegister(
    businessId: string,
    name: string,
    openedById: string,
    closedById: string,
    openingBalance: number,
    sales: { amount: number; method: PaymentMethod; desc?: string }[],
    expenses: { amount: number; desc: string }[],
  ) {
    const reg = await prisma.cashRegister.create({
      data: { name, businessId, status: 'CLOSED', openedAt: d(-2, 8), openedById, closedAt: d(-2, 20), closedById, currentBalance: 0 },
    });

    await prisma.cashMovement.create({
      data: { cashRegisterId: reg.id, type: CashMovementType.OPENING, amount: openingBalance, paymentMethod: PaymentMethod.CASH, description: 'Apertura de caja', createdById: openedById },
    });

    let totalSales = 0;
    let totalExpenses = 0;
    let totalCash = openingBalance;
    let totalCard = 0;
    let totalTransfer = 0;

    for (const s of sales) {
      await prisma.cashMovement.create({
        data: { cashRegisterId: reg.id, type: CashMovementType.SALE, amount: s.amount, paymentMethod: s.method, description: s.desc ?? 'Venta de servicio', createdById: openedById },
      });
      totalSales += s.amount;
      if (s.method === PaymentMethod.CASH) totalCash += s.amount;
      else if (s.method === PaymentMethod.CARD) totalCard += s.amount;
      else totalTransfer += s.amount;
    }

    for (const e of expenses) {
      await prisma.cashMovement.create({
        data: { cashRegisterId: reg.id, type: CashMovementType.EXPENSE, amount: e.amount, paymentMethod: PaymentMethod.CASH, description: e.desc, createdById: openedById },
      });
      totalExpenses += e.amount;
      totalCash -= e.amount;
    }

    const expectedBalance = openingBalance + totalSales - totalExpenses;
    const actualBalance = expectedBalance - Math.round(Math.random() * 200); // diferencia pequeña
    const difference = actualBalance - expectedBalance;

    await prisma.cashMovement.create({
      data: { cashRegisterId: reg.id, type: CashMovementType.CLOSING, amount: actualBalance, paymentMethod: PaymentMethod.CASH, description: 'Cierre de caja', createdById: closedById },
    });

    await prisma.cashClosing.create({
      data: {
        cashRegisterId: reg.id,
        openingBalance,
        expectedBalance,
        actualBalance,
        difference,
        totalSales,
        totalExpenses,
        totalCash,
        totalCard,
        totalTransfer,
        notes: difference !== 0 ? `Diferencia de $${Math.abs(difference)} en cierre` : 'Cierre sin diferencias',
        closedById,
        closedAt: d(-2, 20),
      },
    });

    await prisma.cashRegister.update({ where: { id: reg.id }, data: { currentBalance: actualBalance } });

    return reg;
  }

  // Helper para registros abiertos
  async function createOpenRegister(
    businessId: string,
    name: string,
    openedById: string,
    openingBalance: number,
    sales: { amount: number; method: PaymentMethod; desc?: string }[],
  ) {
    const reg = await prisma.cashRegister.create({
      data: { name, businessId, status: 'OPEN', openedAt: d(0, 8), openedById, currentBalance: openingBalance },
    });

    await prisma.cashMovement.create({
      data: { cashRegisterId: reg.id, type: CashMovementType.OPENING, amount: openingBalance, paymentMethod: PaymentMethod.CASH, description: 'Apertura de caja', createdById: openedById },
    });

    let balance = openingBalance;
    for (const s of sales) {
      await prisma.cashMovement.create({
        data: { cashRegisterId: reg.id, type: CashMovementType.SALE, amount: s.amount, paymentMethod: s.method, description: s.desc ?? 'Venta de servicio', createdById: openedById },
      });
      balance += s.amount;
    }

    await prisma.cashRegister.update({ where: { id: reg.id }, data: { currentBalance: balance } });

    return reg;
  }

  // Barbería — caja cerrada + abierta
  await createClosedRegister(
    barberia.id, 'Caja Principal Barbería', admin1.id, admin1.id, 5000,
    [
      { amount: 5000, method: PaymentMethod.CASH, desc: 'Corte de cabello' },
      { amount: 3000, method: PaymentMethod.CARD, desc: 'Afeitado clásico' },
      { amount: 7000, method: PaymentMethod.CASH, desc: 'Corte y barba' },
      { amount: 8000, method: PaymentMethod.TRANSFER, desc: 'Tinte de cabello' },
    ],
    [{ amount: 2000, desc: 'Compra de insumos (navajas, espuma)' }],
  );

  await createOpenRegister(
    barberia.id, 'Caja del Día', admin1.id, 3000,
    [
      { amount: 5000, method: PaymentMethod.CASH, desc: 'Corte de cabello' },
      { amount: 7000, method: PaymentMethod.CARD, desc: 'Corte y barba' },
    ],
  );

  // Spa — caja cerrada + abierta
  await createClosedRegister(
    spa.id, 'Caja Spa Relax', admin1.id, admin1.id, 8000,
    [
      { amount: 12000, method: PaymentMethod.CARD, desc: 'Masaje relajante' },
      { amount: 9500, method: PaymentMethod.TRANSFER, desc: 'Aromaterapia' },
      { amount: 15000, method: PaymentMethod.CARD, desc: 'Masaje piedras calientes' },
      { amount: 7000, method: PaymentMethod.CASH, desc: 'Limpieza facial' },
    ],
    [
      { amount: 3000, desc: 'Compra de aceites esenciales' },
      { amount: 1500, desc: 'Artículos de limpieza' },
    ],
  );

  await createOpenRegister(
    spa.id, 'Caja del Día Spa', admin1.id, 5000,
    [
      { amount: 12000, method: PaymentMethod.TRANSFER, desc: 'Masaje relajante' },
      { amount: 9500, method: PaymentMethod.CASH, desc: 'Aromaterapia' },
    ],
  );

  // Salón
  await createClosedRegister(
    salon.id, 'Caja Salón Elite', admin2.id, admin2.id, 4000,
    [
      { amount: 4500, method: PaymentMethod.CASH, desc: 'Manicura completa' },
      { amount: 6000, method: PaymentMethod.CARD, desc: 'Peinado de fiesta' },
      { amount: 5500, method: PaymentMethod.TRANSFER, desc: 'Pedicura spa' },
    ],
    [{ amount: 1200, desc: 'Compra de esmaltes' }],
  );

  await createOpenRegister(
    salon.id, 'Caja del Día Salón', admin2.id, 2000,
    [
      { amount: 4500, method: PaymentMethod.CASH, desc: 'Manicura' },
      { amount: 5500, method: PaymentMethod.CARD, desc: 'Pedicura spa' },
    ],
  );

  // Clínica
  await createClosedRegister(
    clinica.id, 'Caja Clínica Derm+', admin2.id, admin2.id, 10000,
    [
      { amount: 35000, method: PaymentMethod.CARD, desc: 'Aplicación de botox' },
      { amount: 20000, method: PaymentMethod.TRANSFER, desc: 'Depilación láser' },
      { amount: 15000, method: PaymentMethod.CARD, desc: 'Limpieza profunda premium' },
    ],
    [
      { amount: 5000, desc: 'Insumos médicos' },
      { amount: 2000, desc: 'Material descartable' },
    ],
  );

  await createOpenRegister(
    clinica.id, 'Caja del Día Clínica', admin2.id, 8000,
    [
      { amount: 35000, method: PaymentMethod.CARD, desc: 'Botox' },
      { amount: 20000, method: PaymentMethod.TRANSFER, desc: 'Depilación láser' },
    ],
  );

  // Gimnasio
  await createClosedRegister(
    gimnasio.id, 'Caja Gimnasio FitLife', admin3.id, admin3.id, 6000,
    [
      { amount: 8000, method: PaymentMethod.CARD, desc: 'Entrenamiento personal' },
      { amount: 3500, method: PaymentMethod.CASH, desc: 'Clase de yoga' },
      { amount: 5000, method: PaymentMethod.CASH, desc: 'Pilates reformer' },
      { amount: 3500, method: PaymentMethod.TRANSFER, desc: 'Clase de yoga' },
    ],
    [{ amount: 1000, desc: 'Mantenimiento de equipos' }],
  );

  await createOpenRegister(
    gimnasio.id, 'Caja del Día Gimnasio', admin3.id, 4000,
    [
      { amount: 8000, method: PaymentMethod.CARD, desc: 'Entrenamiento personal' },
      { amount: 5000, method: PaymentMethod.CASH, desc: 'Pilates reformer' },
    ],
  );

  // Veterinaria
  await createClosedRegister(
    veterinaria.id, 'Caja Veterinaria PetCare', admin3.id, admin3.id, 3000,
    [
      { amount: 6000, method: PaymentMethod.CASH, desc: 'Consulta general' },
      { amount: 4000, method: PaymentMethod.CARD, desc: 'Vacunación' },
      { amount: 8500, method: PaymentMethod.CASH, desc: 'Baño y peluquería' },
    ],
    [{ amount: 2500, desc: 'Compra de vacunas y medicamentos' }],
  );

  await createOpenRegister(
    veterinaria.id, 'Caja del Día Veterinaria', admin3.id, 2000,
    [
      { amount: 6000, method: PaymentMethod.CASH, desc: 'Consulta general' },
      { amount: 8500, method: PaymentMethod.TRANSFER, desc: 'Baño y peluquería' },
    ],
  );

  console.log('✅ Created cash registers (closed + open) for all 6 businesses');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   👤 Users: 3 admins · 8 employees · 5 clients');
  console.log('   🏢 Businesses: 6 (2 per admin)');
  console.log('   💇 Services: 20 across all businesses');
  console.log('   📅 Schedules: configured for all businesses');
  console.log('   📝 Bookings: 40 (COMPLETED / CONFIRMED / PENDING / CANCELLED)');
  console.log('   💰 Cash registers: 12 (1 closed + 1 open per business)');
  console.log('\n🔑 Credentials (password: password123):');
  console.log('   admin1@test.com  · admin2@test.com  · admin3@test.com');
  console.log('   client1@test.com … client5@test.com');
  console.log('   employee1@test.com … employee8@test.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
