import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const placeholder = '/images/cardPlaceholder.png';
const BATCH_SIZE = 1000;

async function main() {
  const descriptor = await fetch('https://api.scryfall.com/bulk-data/default_cards').then(r => r.json());
  const cards: any[] = await fetch(descriptor.download_uri).then(r => r.json());
  const physicalCards = cards.filter(c => c.digital === false);

  let processed = 0;

  while (processed < physicalCards.length) {
    const batch = physicalCards.slice(processed, processed + BATCH_SIZE);
    const operations = batch.map(card => {
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
      let backsideImageUrl = null;

      // Double-faced logic
      if (card_faces?.length === 2 && ['transform', 'modal_dfc', 'double_faced_token'].includes(layout)) {
        const frontFace = card_faces[0];
        const backFace = card_faces[1];
        imageUrl = frontFace?.image_uris?.normal ?? placeholder;
        backsideImageUrl = backFace?.image_uris?.normal ?? null;
        manaCost = mana_cost ?? frontFace?.mana_cost ?? '';
        oracleText = oracle_text ?? frontFace?.oracle_text ?? '';
      }

      // Two-in-one logic (split, adventure)
      if (card_faces?.length === 2 && ['split', 'adventure'].includes(layout)) {
        const face1 = card_faces[0];
        const face2 = card_faces[1];
        name = `${face1?.name ?? ''} // ${face2?.name ?? ''}`;
        manaCost = `${face1?.mana_cost ?? ''} // ${face2?.mana_cost ?? ''}`;
        oracleText = `${face1?.oracle_text ?? ''}\n//\n${face2?.oracle_text ?? ''}`;

        imageUrl =
          layout === 'split'
            ? image_uris?.normal ?? placeholder
            : face1?.image_uris?.normal ?? placeholder;
      }

      return prisma.cardMetadata.upsert({
        where: { scryfallId: id },
        update: {
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
          usdPrice: prices?.usd ? parseFloat(prices.usd) : null,
          usdFoilPrice: prices?.usd_foil ? parseFloat(prices.usd_foil) : null,
        },
        create: {
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
          usdPrice: prices?.usd ? parseFloat(prices.usd) : null,
          usdFoilPrice: prices?.usd_foil ? parseFloat(prices.usd_foil) : null,
        },
      });
    });

    await prisma.$transaction(operations);
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
