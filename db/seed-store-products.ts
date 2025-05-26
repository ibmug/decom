// db/seed-store-products.ts\


import { PrismaClient } from "@prisma/client";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const prisma = new PrismaClient();

  const metas = await prisma.cardMetadata.findMany({
    select: { id: true, name: true, setCode: true },
  });

  for (const { id: cardId, name, setCode } of metas) {
    const slug = toSlug(`${name} ${setCode}`);
    await prisma.storeProduct.upsert({
      where: { slug },
      create: {
        type: "CARD",
        cardId,
        stock: 0,
        price: "0",
        slug,
      },
      update: {
        cardId
      },
    });
  }

  console.log(`✅ Seeded ${metas.length} StoreProduct entries from CardMetadata`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ StoreProduct seeding failed:", e);
  process.exit(1);
});
