-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CLIENT', 'ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."CashMovementType" AS ENUM ('OPENING', 'SALE', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT', 'CLOSING');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'MIXED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'CLIENT',
    "authProvider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "price" DOUBLE PRECISION NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "serviceId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashRegister" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."CashRegisterStatus" NOT NULL DEFAULT 'CLOSED',
    "openedAt" TIMESTAMP(3),
    "openedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashMovement" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "type" "public"."CashMovementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
    "bookingId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashClosing" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL,
    "expectedBalance" DOUBLE PRECISION NOT NULL,
    "actualBalance" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "totalSales" DOUBLE PRECISION NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "totalCash" DOUBLE PRECISION NOT NULL,
    "totalCard" DOUBLE PRECISION NOT NULL,
    "totalTransfer" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "closedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Booking_employeeId_idx" ON "public"."Booking"("employeeId");

-- CreateIndex
CREATE INDEX "Booking_businessId_date_idx" ON "public"."Booking"("businessId", "date");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "public"."Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "CashRegister_businessId_status_idx" ON "public"."CashRegister"("businessId", "status");

-- CreateIndex
CREATE INDEX "CashMovement_cashRegisterId_createdAt_idx" ON "public"."CashMovement"("cashRegisterId", "createdAt");

-- CreateIndex
CREATE INDEX "CashMovement_type_idx" ON "public"."CashMovement"("type");

-- CreateIndex
CREATE INDEX "CashClosing_cashRegisterId_closedAt_idx" ON "public"."CashClosing"("cashRegisterId", "closedAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashRegister" ADD CONSTRAINT "CashRegister_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashRegister" ADD CONSTRAINT "CashRegister_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashRegister" ADD CONSTRAINT "CashRegister_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashMovement" ADD CONSTRAINT "CashMovement_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "public"."CashRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashMovement" ADD CONSTRAINT "CashMovement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashMovement" ADD CONSTRAINT "CashMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashClosing" ADD CONSTRAINT "CashClosing_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "public"."CashRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashClosing" ADD CONSTRAINT "CashClosing_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
