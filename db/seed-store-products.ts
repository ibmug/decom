import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildBaseSlug(name: string, setCode: string) {
  return toSlug(`${name} ${setCode}`);
}

async function buildUniqueSlug(
  baseSlug: string,
  cardMetadataId: string,
  collectorNum: string,
  scryfallId: string,
  prisma: PrismaClient
): Promise<string> {
  // Try base slug first
  const existing = await prisma.storeProduct.findUnique({
    where: { slug: baseSlug },
    include: { cardMetadata: true },
  });

  if (!existing) return baseSlug;

  // If it's the same card, reuse the slug
  if (
    existing.cardMetadataId === cardMetadataId ||
    existing.cardMetadata?.scryfallId === scryfallId
  ) {
    return baseSlug;
  }

  // Append collectorNum
  const slugWithNum = `${baseSlug}-${toSlug(collectorNum)}`;
  const existingNum = await prisma.storeProduct.findUnique({ where: { slug: slugWithNum } });
  if (!existingNum) return slugWithNum;

  // Final fallback: append short scryfallId
  const shortId = scryfallId.slice(0, 8);
  return `${slugWithNum}-${toSlug(shortId)}`;
}

async function main() {
  console.log("🌐 Using database:", process.env.DATABASE_URL);

  const store = await prisma.store.upsert({
    where: { name: 'Default Store' },
    update: {},
    create: {
      name: 'Default Store',
      address: 'Placeholder address',
    },
  });

  const BATCH_SIZE = 1000;
  let skip = 0;
  let totalSeeded = 0;

  while (true) {
    const metas = await prisma.cardMetadata.findMany({
      where: {
        products: {
          none: {}, // Only those without StoreProduct
        },
      },
      select: {
        id: true,
        name: true,
        setCode: true,
        collectorNum: true,
        scryfallId: true,
      },
      take: BATCH_SIZE,
      skip,
    });

    if (metas.length === 0) {
      if (totalSeeded === 0) {
        console.warn("⚠️ No unlinked CardMetadata entries found.");
      }
      break;
    }

    console.log(`📦 Seeding batch ${skip / BATCH_SIZE + 1} (${metas.length} cards)...`);

    for (const meta of metas) {
      const { id: cardMetadataId, name, setCode, collectorNum, scryfallId } = meta;

      const baseSlug = buildBaseSlug(name, setCode);
      const slug = await buildUniqueSlug(baseSlug, cardMetadataId, collectorNum, scryfallId, prisma);

      await prisma.storeProduct.upsert({
        where: { slug },
        update: {
          cardMetadataId,
          storeId: store.id,
        },
        create: {
          slug,
          type: 'CARD',
          cardMetadataId,
          storeId: store.id,
          stock: 0,
          price: "0.00",
        },
      });

      totalSeeded++;
    }

    skip += BATCH_SIZE;
  }

  console.log(`✅ Finished syncing ${totalSeeded} StoreProduct entries.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ StoreProduct seeding failed:", e);
  process.exit(1);
});
