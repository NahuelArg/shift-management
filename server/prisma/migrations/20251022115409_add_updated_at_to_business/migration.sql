-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_businessId_fkey`;

-- DropIndex
DROP INDEX `User_businessId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `booking` ADD COLUMN `employeeId` VARCHAR(191) NULL,
    ALTER COLUMN `endTime` DROP DEFAULT;

-- AlterTable
ALTER TABLE `business` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `service` MODIFY `durationMin` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `Booking_employeeId_idx` ON `Booking`(`employeeId`);

-- CreateIndex
CREATE INDEX `Booking_businessId_date_idx` ON `Booking`(`businessId`, `date`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
