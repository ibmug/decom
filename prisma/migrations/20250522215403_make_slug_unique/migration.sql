/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `CardProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CardProduct_slug_key" ON "CardProduct"("slug");
