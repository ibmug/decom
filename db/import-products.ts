#!/usr/bin/env ts-node

import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH_SIZE = 500;
const DEFAULT_LANGUAGE = 'EN';
const DEFAULT_CONDITION = 'NM';
const DEFAULT_STOCK = 0;

function calculatePrice(usdPrice: number | null | undefined): number {
  if (!usdPrice || usdPrice < 0.6) {
    return 10;
  }
  return usdPrice * 20;
}

async function main() {
  console.log("Starting StoreProduct + Inventory import");

  const totalMetadata = await prisma.cardMetadata.count();
  console.log(`Found ${totalMetadata} cardMetadata records.`);

  for (let skip = 0; skip < totalMetadata; skip += BATCH_SIZE) {
    const batch = await prisma.cardMetadata.findMany({
      skip,
      take: BATCH_SIZE,
    });

    const storeProductOps = batch.map((card) => prisma.storeProduct.upsert({
      where: { slug: `${slugify(card.name)}-${card.setCode}` },
      update: {},
      create: {
        slug: `${slugify(card.name)}-${card.setCode}`,
        type: ProductType.CARD,
        cardMetadata: { connect: { id: card.id } },
        inventory: {
          create: {
            price: calculatePrice(card.usdPrice),
            stock: DEFAULT_STOCK,
            language: DEFAULT_LANGUAGE,
            condition: DEFAULT_CONDITION,
          },
        },
      },
    }));

    await prisma.$transaction(storeProductOps);
    console.log(`✅ Processed batch: ${skip + 1}–${skip + batch.length}`);
  }

  console.log("🎯 StoreProduct + Inventory import complete");
  await prisma.$disconnect();
}

// --- Simple slugify helper ---
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

main().catch((err) => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
