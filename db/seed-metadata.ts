#!/usr/bin/env ts-node
import { PrismaClient } from "@prisma/client";

const placeholder = "/cardPlaceholder.png";

async function main() {
  const prisma = new PrismaClient();
  const descriptor = await fetch("https://api.scryfall.com/bulk-data/default_cards")
    .then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());

  // only physical
  const physicalCards = cards.filter(c => c.digital === false);

  const payload = physicalCards.map((c) => ({
    scryfallId:     c.id,
    name:           c.name,
    setCode:        c.set,
    setName:        c.set_name,
    collectorNum:   c.collector_number,
    oracleText:     c.oracle_text ?? "",
    manaCost:       c.mana_cost ?? "",
    colorIdentity:  c.color_identity ?? [],
    imageUrl:       c.image_uris?.normal ?? placeholder,
    rarity:         c.rarity,
    type:           c.type_line,

    // NEW fields:
    cardKingdomUri: c.purchase_uris?.cardkingdom ?? null,
    usdPrice:       c.prices?.usd ? parseFloat(c.prices.usd) : null,
    usdFoilPrice:   c.prices?.usd_foil ? parseFloat(c.prices.usd_foil) : null,
  }));

  const batchSize = 500;
  for (let i = 0; i < payload.length; i += batchSize) {
    const batch = payload.slice(i, i + batchSize);
    await prisma.cardMetadata.createMany({
      data:           batch,
      skipDuplicates: true,
    });
    console.log(`Inserted cards ${i + 1}–${i + batch.length}`);
  }

  console.log("✅ CardMetadata seeding complete");
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
