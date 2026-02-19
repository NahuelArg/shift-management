import { PrismaClient, Role, AuthProvider, BookingStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Limpiar datos existentes (opcional, comenta si no quieres borrar)
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hashear contraseña para todos los usuarios
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. CREAR USUARIOS
  console.log('👥 Creating users...');

  // Admins
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

  // Clients
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

  console.log(`✅ Created ${5} users`);

  // 2. CREAR NEGOCIOS
  console.log('🏢 Creating businesses...');

  const barberia = await prisma.business.create({
    data: {
      name: 'Barbería Central',
      ownerId: admin1.id,
    },
  });

  const spa = await prisma.business.create({
    data: {
      name: 'Spa Relax',
      ownerId: admin1.id,
    },
  });

  const salon = await prisma.business.create({
    data: {
      name: 'Salón de Belleza Elite',
      ownerId: admin2.id,
    },
  });

  console.log(`✅ Created ${3} businesses`);

  // 3. CREAR EMPLEADOS (asociados a negocios)
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
      name: 'Laura Masajista',
      email: 'employee2@test.com',
      password: hashedPassword,
      phone: '+54 11 5555-6666',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: spa.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'Ana Estilista',
      email: 'employee3@test.com',
      password: hashedPassword,
      phone: '+54 11 7777-8888',
      role: Role.EMPLOYEE,
      authProvider: AuthProvider.LOCAL,
      businessId: salon.id,
    },
  });

  console.log(`✅ Created ${3} employees`);

  // 4. CREAR SERVICIOS
  console.log('💇 Creating services...');

  // Servicios de Barbería
  const corteCabello = await prisma.service.create({
    data: {
      name: 'Corte de Cabello',
      description: 'Corte de cabello profesional con estilo moderno',
      durationMin: 30,
      price: 5000,
      businessId: barberia.id,
    },
  });

  const afeitado = await prisma.service.create({
    data: {
      name: 'Afeitado Clásico',
      description: 'Afeitado tradicional con navaja',
      durationMin: 20,
      price: 3000,
      businessId: barberia.id,
    },
  });

  const tinte = await prisma.service.create({
    data: {
      name: 'Tinte de Cabello',
      description: 'Coloración completa del cabello',
      durationMin: 90,
      price: 8000,
      businessId: barberia.id,
    },
  });

  // Servicios de Spa
  const masajeRelax = await prisma.service.create({
    data: {
      name: 'Masaje Relajante',
      description: 'Masaje de cuerpo completo para relajación',
      durationMin: 60,
      price: 12000,
      businessId: spa.id,
    },
  });

  const facialLimpieza = await prisma.service.create({
    data: {
      name: 'Limpieza Facial',
      description: 'Tratamiento de limpieza profunda facial',
      durationMin: 45,
      price: 7000,
      businessId: spa.id,
    },
  });

  const masajePiedras = await prisma.service.create({
    data: {
      name: 'Masaje con Piedras Calientes',
      description: 'Masaje terapéutico con piedras volcánicas',
      durationMin: 75,
      price: 15000,
      businessId: spa.id,
    },
  });

  // Servicios de Salón
  const manicura = await prisma.service.create({
    data: {
      name: 'Manicura Completa',
      description: 'Manicura con esmaltado permanente',
      durationMin: 45,
      price: 4500,
      businessId: salon.id,
    },
  });

  const pedicura = await prisma.service.create({
    data: {
      name: 'Pedicura Spa',
      description: 'Pedicura con tratamiento hidratante',
      durationMin: 60,
      price: 5500,
      businessId: salon.id,
    },
  });

  const peinado = await prisma.service.create({
    data: {
      name: 'Peinado de Fiesta',
      description: 'Peinado profesional para eventos',
      durationMin: 50,
      price: 6000,
      businessId: salon.id,
    },
  });

  console.log(`✅ Created ${9} services`);

  // 5. CREAR HORARIOS
  console.log('📅 Creating schedules...');

  // Horarios para Barbería (Lunes a Viernes)
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({
      data: {
        dayOfWeek: day,
        from: '09:00',
        to: '19:00',
        businessId: barberia.id,
      },
    });
  }

  // Sábado para Barbería
  await prisma.schedule.create({
    data: {
      dayOfWeek: 6,
      from: '10:00',
      to: '14:00',
      businessId: barberia.id,
    },
  });

  // Horarios para Spa (Lunes a Sábado)
  for (let day = 1; day <= 6; day++) {
    await prisma.schedule.create({
      data: {
        dayOfWeek: day,
        from: '10:00',
        to: '20:00',
        businessId: spa.id,
      },
    });
  }

  // Horarios para Salón (Martes a Sábado)
  for (let day = 2; day <= 6; day++) {
    await prisma.schedule.create({
      data: {
        dayOfWeek: day,
        from: '09:30',
        to: '18:30',
        businessId: salon.id,
      },
    });
  }

  console.log(`✅ Created schedules`);

  // 6. CREAR RESERVAS
  console.log('📝 Creating bookings...');

  const now = new Date();

  // Reservas PASADAS (mes pasado) - COMPLETED
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await prisma.booking.create({
    data: {
      userId: client1.id,
      serviceId: corteCabello.id,
      businessId: barberia.id,
      employeeId: employee1.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5, 10, 0),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5, 10, 30),
      finalPrice: 5000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client2.id,
      serviceId: masajeRelax.id,
      businessId: spa.id,
      employeeId: employee2.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10, 14, 0),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10, 15, 0),
      finalPrice: 12000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client3.id,
      serviceId: manicura.id,
      businessId: salon.id,
      employeeId: employee3.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15, 11, 0),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15, 11, 45),
      finalPrice: 4500,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client1.id,
      serviceId: afeitado.id,
      businessId: barberia.id,
      employeeId: employee1.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 20, 16, 0),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 20, 16, 20),
      finalPrice: 3000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client2.id,
      serviceId: facialLimpieza.id,
      businessId: spa.id,
      employeeId: employee2.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 25, 15, 30),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 25, 16, 15),
      finalPrice: 7000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  // Reservas de ESTA SEMANA - CONFIRMED
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  await prisma.booking.create({
    data: {
      userId: client3.id,
      serviceId: tinte.id,
      businessId: barberia.id,
      employeeId: employee1.id,
      date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 30),
      finalPrice: 8000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client1.id,
      serviceId: masajePiedras.id,
      businessId: spa.id,
      employeeId: employee2.id,
      date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0),
      endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 15),
      finalPrice: 15000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client2.id,
      serviceId: peinado.id,
      businessId: salon.id,
      employeeId: employee3.id,
      date: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 12, 0),
      endTime: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 12, 50),
      finalPrice: 6000,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  // Reservas FUTURAS - PENDING
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.booking.create({
    data: {
      userId: client3.id,
      serviceId: corteCabello.id,
      businessId: barberia.id,
      date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 11, 0),
      endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 11, 30),
      finalPrice: 5000,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client1.id,
      serviceId: pedicura.id,
      businessId: salon.id,
      date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 2, 15, 0),
      endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 2, 16, 0),
      finalPrice: 5500,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client2.id,
      serviceId: masajeRelax.id,
      businessId: spa.id,
      date: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 3, 16, 30),
      endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 3, 17, 30),
      finalPrice: 12000,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  // Reservas CANCELADAS
  await prisma.booking.create({
    data: {
      userId: client3.id,
      serviceId: afeitado.id,
      businessId: barberia.id,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 12, 9, 0),
      endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 12, 9, 20),
      finalPrice: 3000,
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  await prisma.booking.create({
    data: {
      userId: client1.id,
      serviceId: manicura.id,
      businessId: salon.id,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 13, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 13, 45),
      finalPrice: 4500,
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.PENDING,
      timezone: 'America/Argentina/Buenos_Aires',
    },
  });

  console.log(`✅ Created ${13} bookings`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 8 Users (2 admins, 3 employees, 3 clients)');
  console.log('   - 3 Businesses');
  console.log('   - 9 Services');
  console.log('   - Schedules for all businesses');
  console.log('   - 13 Bookings (various dates and statuses)');
  console.log('\n🔑 Login credentials (all passwords: password123):');
  console.log('   Admin 1: admin1@test.com');
  console.log('   Admin 2: admin2@test.com');
  console.log('   Client 1: client1@test.com');
  console.log('   Client 2: client2@test.com');
  console.log('   Client 3: client3@test.com');
  console.log('   Employee 1: employee1@test.com');
  console.log('   Employee 2: employee2@test.com');
  console.log('   Employee 3: employee3@test.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
