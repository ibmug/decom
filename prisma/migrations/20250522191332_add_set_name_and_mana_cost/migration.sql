/*
  Warnings:

  - Added the required column `manaCost` to the `CardMetadata` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setName` to the `CardMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CardMetadata" ADD COLUMN     "manaCost" TEXT NOT NULL,
ADD COLUMN     "setName" TEXT NOT NULL;
