-- AlterTable
ALTER TABLE `booking` ADD COLUMN `paymentMethod` ENUM('CASH', 'CARD', 'TRANSFER', 'MIXED') NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `business` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `CashRegister` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'CLOSED',
    `openedAt` DATETIME(3) NULL,
    `OpenedById` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,
    `closedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CashRegister_businessId_status_idx`(`businessId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashMovement` (
    `id` VARCHAR(191) NOT NULL,
    `cashRegisterId` VARCHAR(191) NOT NULL,
    `type` ENUM('OPENING', 'SALE', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT', 'CLOSING') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMethod` ENUM('CASH', 'CARD', 'TRANSFER', 'MIXED') NOT NULL DEFAULT 'CASH',
    `bookingId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CashMovement_cashRegisterId_createdAt_idx`(`cashRegisterId`, `createdAt`),
    INDEX `CashMovement_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashClosing` (
    `id` VARCHAR(191) NOT NULL,
    `cashRegisterId` VARCHAR(191) NOT NULL,
    `openingBalance` DOUBLE NOT NULL,
    `expectedBalance` DOUBLE NOT NULL,
    `actualBalance` DOUBLE NOT NULL,
    `difference` DOUBLE NOT NULL,
    `totalSales` DOUBLE NOT NULL,
    `totalExpenses` DOUBLE NOT NULL,
    `totalCash` DOUBLE NOT NULL,
    `totalCard` DOUBLE NOT NULL,
    `totalTransfer` DOUBLE NOT NULL,
    `notes` VARCHAR(191) NULL,
    `closedById` VARCHAR(191) NOT NULL,
    `closedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CashClosing_cashRegisterId_closedAt_idx`(`cashRegisterId`, `closedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Booking_paymentStatus_idx` ON `Booking`(`paymentStatus`);

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_OpenedById_fkey` FOREIGN KEY (`OpenedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `CashRegister`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashClosing` ADD CONSTRAINT `CashClosing_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `CashRegister`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashClosing` ADD CONSTRAINT `CashClosing_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
