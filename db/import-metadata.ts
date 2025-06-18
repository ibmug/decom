import { PrismaClient, ProductType } from '@prisma/client';
import slugify from 'slugify';
import pLimit from 'p-limit';

const prisma = new PrismaClient();
const placeholder = '/images/cardPlaceholder.png';
const BATCH_SIZE = 250;
const CONCURRENCY_LIMIT = 20;
const limit = pLimit(CONCURRENCY_LIMIT);
const DEFAULT_LANGUAGE = 'EN';
const DEFAULT_CONDITION = 'NM';
const DEFAULT_STOCK = 0;

// Normalize slug consistently
function normalizeSlug(name: string, set: string, collectorNum: string): string {
  return slugify(`${name} ${set} ${collectorNum}`, { lower: true, strict: true });
}

// Price calculation logic
function calculatePrice(usdPrice: number | null | undefined): number {
  if (!usdPrice || usdPrice < 0.6) {
    return 10;
  }
  return usdPrice * 20;
}

async function main() {
  console.log("Downloading Scryfall data...");
  const descriptor = await fetch('https://api.scryfall.com/bulk-data/default_cards').then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());
  const physicalCards = cards.filter(c => c.digital === false);

  let processed = 0;
  while (processed < physicalCards.length) {
    const batch = physicalCards.slice(processed, processed + BATCH_SIZE);

    const operations = batch.map(card => limit(async () => {
      const {
        id: scryfallId,
        oracle_id: oracleId,
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
      const cardImages: string[] = [];

      // Handle multiple layouts
      if (card_faces?.length === 2 && ['transform', 'modal_dfc', 'double_faced_token', 'battle'].includes(layout)) {
        const frontFace = card_faces[0];
        const backFace = card_faces[1];
        imageUrl = frontFace?.image_uris?.normal ?? placeholder;
        manaCost = frontFace?.mana_cost ?? manaCost;
        oracleText = frontFace?.oracle_text ?? oracleText;
        cardImages.push(imageUrl);
        if (backFace?.image_uris?.normal) {
          cardImages.push(backFace.image_uris.normal);
        }
      } else if (card_faces?.length === 2 && ['split', 'adventure', 'flip', 'meld'].includes(layout)) {
        const face1 = card_faces[0];
        const face2 = card_faces[1];
        name = `${face1?.name ?? ''} // ${face2?.name ?? ''}`;
        manaCost = `${face1?.mana_cost ?? ''} // ${face2?.mana_cost ?? ''}`;
        oracleText = `${face1?.oracle_text ?? ''}\n//\n${face2?.oracle_text ?? ''}`;
        const firstImage = layout === 'split' ? image_uris?.normal : face1?.image_uris?.normal;
        cardImages.push(firstImage ?? placeholder);
      } else {
        cardImages.push(imageUrl);
      }

      const slug = normalizeSlug(name, set, collector_number);
      const safeOracleId = oracleId ?? 'UNKNOWN';
      const finalPrice = calculatePrice(prices?.usd ? parseFloat(prices.usd) : null);

      // Sequential transaction: first CardMetadata, then StoreProduct
      return prisma.$transaction(async (tx) => {
        const cardMetadata = await tx.cardMetadata.upsert({
          where: { scryfallId },
          update: {
            oracleId: safeOracleId,
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
            scryfallId,
            oracleId: safeOracleId,
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
        });

        await tx.storeProduct.upsert({
          where: { slug },
          update: {
            type: 'CARD',
            cardMetadataId: cardMetadata.id,
            images: cardImages,
            price: finalPrice,
          },
          create: {
            slug,
            type: ProductType.CARD,
            cardMetadataId: cardMetadata.id,
            images: cardImages,
            price: finalPrice,
            inventory: {
              create: {
                stock: DEFAULT_STOCK,
                language: DEFAULT_LANGUAGE,
                condition: DEFAULT_CONDITION,
              },
            },
          },
        });
      });
    }));

    await Promise.all(operations);
    processed += BATCH_SIZE;
    console.log(`✅ Processed batch: ${processed}/${physicalCards.length}`);
  }

  console.log('🎯 Full import completed successfully.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Import error:', err);
  process.exit(1);
});
