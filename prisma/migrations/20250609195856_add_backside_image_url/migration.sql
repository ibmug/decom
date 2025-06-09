/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "CardMetadata" ADD COLUMN     "backsideImageUrl" TEXT;

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "VerificationToken";
