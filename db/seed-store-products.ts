// db/seed-store-products.ts
import 'dotenv/config'; // ✅ Ensure .env is loaded
import { PrismaClient } from '@prisma/client';

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌐 Using database:", process.env.DATABASE_URL);

  const prisma = new PrismaClient();
  const BATCH_SIZE = 1000;
  let skip = 0;
  let totalSeeded = 0;

  while (true) {
    const metas = await prisma.cardMetadata.findMany({
      select: { id: true, name: true, setCode: true },
      take: BATCH_SIZE,
      skip,
    });

    if (metas.length === 0) {
      if (totalSeeded === 0) {
        console.warn("⚠️ No CardMetadata entries found. Double-check your database.");
      }
      break;
    }

    console.log(`📦 Seeding batch ${skip / BATCH_SIZE + 1} (${metas.length} cards)...`);

    for (const { id: cardId, name, setCode } of metas) {
      const slug = toSlug(`${name} ${setCode}`);
      await prisma.storeProduct.upsert({
        where: { slug },
        create: {
          type: 'CARD',
          cardId,
          stock: 0,
          price: "0",
          slug,
        },
        update: {
          cardId,
        },
      });
    }

    totalSeeded += metas.length;
    skip += BATCH_SIZE;
  }

  console.log(`✅ Finished seeding ${totalSeeded} StoreProduct entries from CardMetadata`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ StoreProduct seeding failed:", e);
  process.exit(1);
});
