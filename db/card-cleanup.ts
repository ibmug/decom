import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting CardMetadata deduplication...");

  // Use raw unsafe query (still safe for read-only aggregation)
  const duplicates = await prisma.$queryRawUnsafe<any[]>(`
    SELECT "name", "setCode", COUNT(*) as count
    FROM "CardMetadata"
    GROUP BY "name", "setCode"
    HAVING COUNT(*) > 1
  `);

  console.log(`Found ${duplicates.length} duplicate groups.`);

  for (const dup of duplicates) {
    const { name, setCode } = dup;

    // Fetch all matching rows
    const entries = await prisma.cardMetadata.findMany({
      where: { name, setCode },
      orderBy: { scryfallId: 'asc' }  // Deterministic ordering
    });

    const [keep, ...toDelete] = entries;

    console.log(`\nDeduplicating ${name} (${setCode})`);
    console.log(`Keeping: ${keep.id}`);
    console.log(`Deleting: ${toDelete.map(e => e.id).join(', ')}`);

    // Update StoreProducts that reference any of the duplicates
    for (const del of toDelete) {
      const updated = await prisma.storeProduct.updateMany({
        where: { cardMetadataId: del.id },
        data: { cardMetadataId: keep.id }
      });

      console.log(`Repointed ${updated.count} StoreProducts from ${del.id} to ${keep.id}`);
    }

    // Delete the orphaned CardMetadata entries
    for (const del of toDelete) {
      await prisma.cardMetadata.delete({ where: { id: del.id } });
    }
  }

  console.log("\n✅ Cleanup complete.");
}

main()
  .catch(e => {
    console.error("❌ Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
