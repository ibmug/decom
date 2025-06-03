-- DropForeignKey
ALTER TABLE "StoreProduct" DROP CONSTRAINT "StoreProduct_storeId_fkey";

-- AlterTable
ALTER TABLE "StoreProduct" ALTER COLUMN "storeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
