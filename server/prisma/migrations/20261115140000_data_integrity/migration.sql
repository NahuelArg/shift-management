-- Integridad de datos (auditoría, fase 3)
-- * Dinero: DOUBLE PRECISION -> DECIMAL(12,2) (sin errores de redondeo).
-- * Service.active: soft delete para no perder historial de reservas.
-- * Booking.user ON DELETE SET NULL: borrar un cliente no borra sus reservas.
-- * Booking.service ON DELETE NO ACTION: no se puede borrar un servicio con reservas
--   (NO ACTION y no RESTRICT para que el borrado en cascada de un Business siga funcionando).
-- * Índices para todas las claves foráneas (incluye Service_businessId_idx, que estaba
--   en schema.prisma pero nunca se había migrado).

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "finalPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "CashClosing" ALTER COLUMN "openingBalance" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "expectedBalance" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "actualBalance" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "difference" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalSales" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalExpenses" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalCash" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalCard" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalTransfer" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "CashMovement" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "CashRegister" ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "CashClosing_closedById_idx" ON "CashClosing"("closedById");

-- CreateIndex
CREATE INDEX "CashMovement_bookingId_idx" ON "CashMovement"("bookingId");

-- CreateIndex
CREATE INDEX "CashMovement_createdById_idx" ON "CashMovement"("createdById");

-- CreateIndex
CREATE INDEX "CashRegister_openedById_idx" ON "CashRegister"("openedById");

-- CreateIndex
CREATE INDEX "CashRegister_closedById_idx" ON "CashRegister"("closedById");

-- CreateIndex
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

