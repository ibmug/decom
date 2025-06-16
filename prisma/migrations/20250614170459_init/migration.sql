/*
  Warnings:

  - You are about to drop the column `images` on the `AccessoryProduct` table. All the data in the column will be lost.
  - You are about to drop the column `numReviews` on the `AccessoryProduct` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `AccessoryProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccessoryProduct" DROP COLUMN "images",
DROP COLUMN "numReviews",
DROP COLUMN "rating";

-- AlterTable
ALTER TABLE "StoreProduct" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "numReviews" INTEGER DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0;
