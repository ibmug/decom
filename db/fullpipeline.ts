#!/usr/bin/env ts-node

import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 500;
const placeholder = '/images/cardPlaceholder.png';

// ------------------------------------
// STEP 1 - Import CardMetadata
// ------------------------------------

async function importMetadata() {
  console.log("🟢 Starting CardMetadata import...");

  const descriptor = await fetch('https://api.scryfall.com/bulk-data/default_cards').then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());
  const physicalCards = cards.filter(c => c.digital === false);

  for (let i = 0; i < physicalCards.length; i += BATCH_SIZE) {
    const batch = physicalCards.slice(i, i + BATCH_SIZE);

    const formatted = batch.map(card => {
      const {
        id, layout, card_faces, mana_cost, oracle_text,
        set, set_name, collector_number, color_identity,
        rarity, type_line, prices, cmc, image_uris
      } = card;

      let name = card.name;
      let manaCost = mana_cost ?? '';
      let oracleText = oracle_text ?? '';
      let imageUrl = image_uris?.normal ?? placeholder;
      let backsideImageUrl = null;

      // Handle Double-Faced
      if (card_faces?.length === 2 && ['transform', 'modal_dfc', 'double_faced_token'].includes(layout)) {
        const frontFace = card_faces[0];
        const backFace = card_faces[1];
        imageUrl = frontFace?.image_uris?.normal ?? placeholder;
        backsideImageUrl = backFace?.image_uris?.normal ?? null;
        manaCost = mana_cost ?? frontFace?.mana_cost ?? '';
        oracleText = oracle_text ?? frontFace?.oracle_text ?? '';
      }

      // Handle Split/Adventure
      if (card_faces?.length === 2 && ['split', 'adventure'].includes(layout)) {
        const face1 = card_faces[0];
        const face2 = card_faces[1];
        name = `${face1?.name ?? ''} // ${face2?.name ?? ''}`;
        manaCost = `${face1?.mana_cost ?? ''} // ${face2?.mana_cost ?? ''}`;
        oracleText = `${face1?.oracle_text ?? ''}\n//\n${face2?.oracle_text ?? ''}`;
        imageUrl = layout === 'split' ? image_uris?.normal ?? placeholder : face1?.image_uris?.normal ?? placeholder;
      }

      return {
        scryfallId: id,
        name,
        manaCost,
        oracleText,
        cmc: cmc ?? null,
        imageUrl,
        backsideImageUrl,
        setCode: set,
        setName: set_name,
        collectorNum: collector_number,
        colorIdentity: color_identity,
        rarity: rarity,
        type: type_line,
        cardKingdomUri: card.purchase_uris?.cardkingdom ?? null,
        usdPrice: prices?.usd ? parseFloat(prices.usd) : null,
        usdFoilPrice: prices?.usd_foil ? parseFloat(prices.usd_foil) : null,
      };
    });

    await prisma.cardMetadata.createMany({
      data: formatted,
      skipDuplicates: true,
    });

    console.log(`✅ Inserted CardMetadata batch ${i + 1}–${i + batch.length}`);
  }

  console.log("✅ Finished CardMetadata import.");
}

// ------------------------------------
// STEP 2 - Import StoreProduct & Inventory
// ------------------------------------

async function importStoreProducts() {
  console.log("🟢 Starting StoreProduct + Inventory import...");

  const totalMetadata = await prisma.cardMetadata.count();

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
            stock: 0,
            language: 'EN',
            condition: 'NM',
          },
        },
      },
    }));

    await prisma.$transaction(storeProductOps);
    console.log(`✅ Inserted StoreProducts batch ${skip + 1}–${skip + batch.length}`);
  }

  console.log("✅ Finished StoreProduct + Inventory import.");
}

// ------------------------------------
// Helper functions
// ------------------------------------

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function calculatePrice(usdPrice: number | null | undefined): number {
  if (!usdPrice || usdPrice < 0.6) return 10;
  return usdPrice * 20;
}

// ------------------------------------
// Full pipeline runner
// ------------------------------------

async function runPipeline() {
  await importMetadata();
  await importStoreProducts();
  await prisma.$disconnect();
}

runPipeline().catch((err) => {
  console.error('❌ Pipeline error:', err);
  process.exit(1);
});
