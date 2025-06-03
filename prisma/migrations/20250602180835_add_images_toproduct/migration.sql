/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `AccessoryProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccessoryProduct" DROP COLUMN "imageUrl",
ADD COLUMN     "images" TEXT[];
