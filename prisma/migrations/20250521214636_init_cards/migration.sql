-- CreateTable
CREATE TABLE "CardMetadata" (
    "id" TEXT NOT NULL,
    "scryfallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setCode" TEXT NOT NULL,
    "collectorNum" TEXT NOT NULL,
    "oracleText" TEXT,
    "colorIdentity" TEXT[],
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "CardMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardProduct" (
    "id" TEXT NOT NULL,
    "metadataId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CardProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardMetadata_scryfallId_key" ON "CardMetadata"("scryfallId");

-- AddForeignKey
ALTER TABLE "CardProduct" ADD CONSTRAINT "CardProduct_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "CardMetadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
