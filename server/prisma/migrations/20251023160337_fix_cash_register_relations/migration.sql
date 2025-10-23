/*
  Warnings:

  - You are about to drop the column `OpenedById` on the `cashregister` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `cashregister` DROP FOREIGN KEY `CashRegister_OpenedById_fkey`;

-- DropIndex
DROP INDEX `CashRegister_OpenedById_fkey` ON `cashregister`;

-- AlterTable
ALTER TABLE `cashregister` DROP COLUMN `OpenedById`,
    ADD COLUMN `openedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
