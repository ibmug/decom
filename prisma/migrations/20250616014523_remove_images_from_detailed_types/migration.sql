/*
  Warnings:

  - You are about to drop the column `backsideImageUrl` on the `CardMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `CardMetadata` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CardMetadata" DROP COLUMN "backsideImageUrl",
DROP COLUMN "imageUrl";
