/*
  Warnings:

  - You are about to drop the column `isDelivered` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `Order` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `AccessoryProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'READY_FOR_PICKUP', 'PICKED_UP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "AccessoryProduct" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isDelivered",
DROP COLUMN "isPaid",
ADD COLUMN     "pickedUpAt" TIMESTAMP(6),
ADD COLUMN     "shippingMethod" "ShippingMethod" NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "newCart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "sessionCartId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newCartItem" (
    "id" TEXT NOT NULL,
    "cartId" UUID NOT NULL,
    "storeProductId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newCartId" UUID,

    CONSTRAINT "newCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newCart_sessionCartId_key" ON "newCart"("sessionCartId");

-- CreateIndex
CREATE UNIQUE INDEX "newCartItem_cartId_storeProductId_key" ON "newCartItem"("cartId", "storeProductId");

-- AddForeignKey
ALTER TABLE "newCart" ADD CONSTRAINT "newCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newCartItem" ADD CONSTRAINT "newCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newCartItem" ADD CONSTRAINT "newCartItem_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "StoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newCartItem" ADD CONSTRAINT "newCartItem_newCartId_fkey" FOREIGN KEY ("newCartId") REFERENCES "newCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
