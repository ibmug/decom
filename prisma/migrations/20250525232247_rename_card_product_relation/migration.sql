/*
  Warnings:

  - You are about to drop the `CardProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CardProduct" DROP CONSTRAINT "CardProduct_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "StoreProduct" DROP CONSTRAINT "StoreProduct_cardId_fkey";

-- DropTable
DROP TABLE "CardProduct";

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;
