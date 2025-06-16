import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();
const placeholder = '/images/cardPlaceholder.png';
const BATCH_SIZE = 1000;

// --- Safe slug generator ---
function normalizeSlug(input: string, set: string): string {
  return slugify(`${input} ${set}`, { lower: true, strict: true });
}

// --- Main importer ---
async function main() {
  const descriptor = await fetch('https://api.scryfall.com/bulk-data/default_cards').then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());
  const physicalCards = cards.filter(c => c.digital === false);

  let processed = 0;

  while (processed < physicalCards.length) {
    const batch = physicalCards.slice(processed, processed + BATCH_SIZE);

    const operations = batch.map(async card => {
      const {
        id,
        layout,
        card_faces,
        mana_cost,
        oracle_text,
        set,
        set_name,
        collector_number,
        color_identity,
        rarity,
        type_line,
        prices,
        cmc,
        image_uris,
      } = card;

      let name = card.name;
      let manaCost = mana_cost ?? '';
      let oracleText = oracle_text ?? '';
      let imageUrl = image_uris?.normal ?? placeholder;
      let backsideImageUrl: string | null = null;
      const cardImages: string[] = [];

      // --- Handle double-faced ---
      if (card_faces?.length === 2 && ['transform', 'modal_dfc', 'double_faced_token'].includes(layout)) {
        const frontFace = card_faces[0];
        const backFace = card_faces[1];
        imageUrl = frontFace?.image_uris?.normal ?? placeholder;
        backsideImageUrl = backFace?.image_uris?.normal ?? null;
        manaCost = frontFace?.mana_cost ?? manaCost;
        oracleText = frontFace?.oracle_text ?? oracleText;

        cardImages.push(frontFace?.image_uris?.normal ?? placeholder);
        if (backFace?.image_uris?.normal) {
          cardImages.push(backFace.image_uris.normal);
        }
      }

      // --- Handle split / adventure ---
      else if (card_faces?.length === 2 && ['split', 'adventure'].includes(layout)) {
        const face1 = card_faces[0];
        const face2 = card_faces[1];
        name = `${face1?.name ?? ''} // ${face2?.name ?? ''}`;
        manaCost = `${face1?.mana_cost ?? ''} // ${face2?.mana_cost ?? ''}`;
        oracleText = `${face1?.oracle_text ?? ''}\n//\n${face2?.oracle_text ?? ''}`;

        const firstImage = layout === 'split' ? image_uris?.normal : face1?.image_uris?.normal;
        cardImages.push(firstImage ?? placeholder);
      }

      // --- Standard single-face ---
      else {
        cardImages.push(imageUrl);
      }

      const slug = normalizeSlug(name, set);

      // Prisma transaction for each card:
      return prisma.$transaction([
        prisma.cardMetadata.upsert({
          where: { scryfallId: id },
          update: {
            name,
            manaCost,
            oracleText,
            cmc: cmc ?? null,
            setCode: set,
            setName: set_name,
            collectorNum: collector_number,
            colorIdentity: color_identity,
            rarity: rarity,
            type: type_line,
            usdPrice: prices?.usd ? parseFloat(prices.usd) : null,
            usdFoilPrice: prices?.usd_foil ? parseFloat(prices.usd_foil) : null,
          },
          create: {
            scryfallId: id,
            name,
            manaCost,
            oracleText,
            cmc: cmc ?? null,
            setCode: set,
            setName: set_name,
            collectorNum: collector_number,
            colorIdentity: color_identity,
            rarity: rarity,
            type: type_line,
            usdPrice: prices?.usd ? parseFloat(prices.usd) : null,
            usdFoilPrice: prices?.usd_foil ? parseFloat(prices.usd_foil) : null,
          },
        }),

        prisma.storeProduct.upsert({
          where: { slug },
          update: {
            type: 'CARD',
            cardMetadataId: id,
            images: cardImages,
          },
          create: {
            slug,
            type: 'CARD',
            cardMetadataId: id,
            images: cardImages,
          },
        }),
      ]);
    });

    // Await all operations concurrently
    const allResults = await Promise.all(operations);
    processed += BATCH_SIZE;
    console.log(`✅ Processed batch: ${processed}/${physicalCards.length}`);
  }

  console.log('✅ All cards imported successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Import error:', err);
  process.exit(1);
});
