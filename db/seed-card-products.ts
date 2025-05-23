#!/usr/bin/env ts-node
import { PrismaClient } from "@prisma/client";

// slugify helper (you can tweak to taste)
function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const prisma = new PrismaClient();

  // 1) Pull every metadata id + name + setCode
  const metas = await prisma.cardMetadata.findMany({
    select: { id: true, name: true, setCode: true },
  });

  // 2) Upsert (or createMany) per metadata, slug includes setCode
  for (const { id: metadataId, name, setCode } of metas) {
    const slug = toSlug(`${name} ${setCode}`);  // e.g. "forest war"
    await prisma.cardProduct.upsert({
      where: { slug },
      create: {
        metadataId,
        stock: 0,
        price: "0",
        slug,
      },
      update: {},  // no-op if it already exists
    });
  }

  console.log(`✅ Seeded ${metas.length} CardProduct rows`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
