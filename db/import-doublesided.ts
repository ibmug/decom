import { PrismaClient } from '@prisma/client';

const placeholder = '/images/cardPlaceholder.png';
const prisma = new PrismaClient();

async function main() {
  const descriptor = await fetch('https://api.scryfall.com/bulk-data/default_cards').then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());

  // Filter only physical cards
  const physicalCards = cards.filter(c => c.digital === false);

  // Filter double-faced cards
  const doubleFaced = physicalCards.filter(c => c.card_faces && c.card_faces.length > 1);

  let updatedCount = 0;

  for (const card of doubleFaced) {
    const frontFace = card.card_faces?.[0];
    const backFace = card.card_faces?.[1];

    if (!frontFace || !backFace) continue;

    const update = await prisma.cardMetadata.updateMany({
      where: {
        scryfallId: card.id,
      },
      data: {
        manaCost: card.mana_cost ?? frontFace.mana_cost ?? '',
        oracleText: card.oracle_text ?? frontFace.oracle_text ?? '',
        imageUrl: frontFace.image_uris?.normal ?? placeholder,
        backsideImageUrl: backFace.image_uris?.normal ?? null,
      },
    });

    if (update.count > 0) updatedCount++;
  }

  console.log(`✅ Updated ${updatedCount} double-faced cards.`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Update error:', err);
  process.exit(1);
});
