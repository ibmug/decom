/*
  Warnings:

  - Made the column `slug` on table `CardProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CARD', 'ACCESSORY');

-- AlterTable
ALTER TABLE "CardMetadata" ALTER COLUMN "manaCost" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CardProduct" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "cardId" TEXT,
    "accessoryId" TEXT,
    "stock" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessoryProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,

    CONSTRAINT "AccessoryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_cardId_key" ON "StoreProduct"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_accessoryId_key" ON "StoreProduct"("accessoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_slug_key" ON "StoreProduct"("slug");

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "AccessoryProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
