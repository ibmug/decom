-- AlterTable
ALTER TABLE "CardMetadata" ADD COLUMN     "rarity" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "CardProduct" ADD COLUMN     "slug" TEXT;
