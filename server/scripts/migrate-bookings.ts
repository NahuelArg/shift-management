import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBookings() {
  console.log('🔄 Iniciando migración de bookings...');

  // 1. Obtener todos los bookings sin empleado asignado
  const bookingsWithoutEmployee = await prisma.booking.findMany({
    where: {
      employeeId: null,
    },
    include: {
      business: true,
    },
  });

  console.log(`📊 Encontrados ${bookingsWithoutEmployee.length} bookings sin empleado`);

  // 2. Para cada booking, asignar un empleado del negocio
  for (const booking of bookingsWithoutEmployee) {
    // Buscar empleados del negocio
    const employees = await prisma.user.findMany({
      where: {
        businessId: booking.businessId,
        role: 'EMPLOYEE',
      },
    });

    if (employees.length === 0) {
      console.warn(`⚠️  Booking ${booking.id}: No hay empleados en el negocio ${booking.businessId}`);
      continue;
    }

    // Asignar el primer empleado disponible
    const employee = employees[0];

    await prisma.booking.update({
      where: { id: booking.id },
      data: { employeeId: employee.id },
    });

    console.log(`✅ Booking ${booking.id} → Empleado ${employee.name}`);
  }

  console.log('✅ Migración completada');
}

migrateBookings()
  .catch((e) => {
    console.error('❌ Error en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });