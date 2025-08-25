/*
  Warnings:

  - You are about to drop the column `endTme` on the `booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `booking` DROP COLUMN `endTme`,
    ADD COLUMN `endTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
