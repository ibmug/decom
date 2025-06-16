import { prisma } from "@/db/prisma";
import { CardItem } from "@/types";
import { Prisma } from "@prisma/client";

// --- Get Single Card by Slug ---
export async function getSingleCardBySlug(slug: string) {
  const raw = await prisma.storeProduct.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      images: true, // ✅ now coming from StoreProduct
      cardMetadata: {
        select: {
          id: true,
          name: true,
          oracleText: true,
          setCode: true,
          manaCost: true,
          collectorNum: true,
          colorIdentity: true,
          type: true,
          rarity: true,
          setName: true,
          usdPrice: true,
          usdFoilPrice: true,
        }
      },
      inventory: {
        select: {
          id: true,
          price: true,
          stock: true,
          language: true,
          condition: true,
        }
      }
    }
  });

  if (!raw || !raw.cardMetadata) return null;

  const inv = raw.inventory[0];
  const imageUrl = raw.images?.[0] ?? '/images/cardPlaceholder.png';

  return {
    id: raw.cardMetadata.id,
    productId: raw.id,
    slug: raw.slug ?? "",
    name: raw.cardMetadata.name,
    setCode: raw.cardMetadata.setCode,
    setName: raw.cardMetadata.setName,
    manaCost: raw.cardMetadata.manaCost ?? "",
    collectorNum: raw.cardMetadata.collectorNum,
    oracleText: raw.cardMetadata.oracleText ?? "",
    colorIdentity: raw.cardMetadata.colorIdentity,
    imageUrl: imageUrl,
    backsideImageUrl: undefined,  // ✅ handled in storeProduct.images if needed later
    rarity: raw.cardMetadata.rarity ?? "",
    type: raw.cardMetadata.type ?? "",
    cardKingdomUri: undefined,
    usdPrice: raw.cardMetadata.usdPrice ?? undefined,
    usdFoilPrice: raw.cardMetadata.usdFoilPrice ?? undefined,
    price: inv?.price.toString() ?? "0.00",
    stock: inv?.stock ?? 0,
    inventory: raw.inventory.map((i) => ({
      id: i.id,
      price: i.price.toString(),
      stock: i.stock,
      language: i.language ?? undefined,
      condition: i.condition ?? undefined
    }))
  };
}

// --- Search Cards with Inventory support ---

export async function searchCards({
  query = '',
  page = 1,
  limit = 12,
}: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CardItem[]; totalPages: number; currentPage: number }> {

  const terms = query.trim().split(/\s+/).filter(Boolean);

  const metadataWhere: Prisma.CardMetadataWhereInput = {};
  if (terms.length) {
    metadataWhere.OR = terms.flatMap(term => [
      { name: { contains: term, mode: 'insensitive' } },
      { type: { contains: term, mode: 'insensitive' } },
      { oracleText: { contains: term, mode: 'insensitive' } },
    ]);
  }

  const where: Prisma.StoreProductWhereInput = {
    cardMetadata: { is: metadataWhere },
  };

  const total = await prisma.storeProduct.count({ where });

  const rows = await prisma.storeProduct.findMany({
    where,
    include: {
      cardMetadata: true,
      inventory: true,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows
    .filter((r) => r.cardMetadata)
    .map((r) => {
      const m = r.cardMetadata!;
      const inv = r.inventory[0];
      const imageUrl = r.images?.[0] ?? '/images/cardPlaceholder.png';

      return {
        id: m.id,
        productId: r.id,
        slug: r.slug ?? '',
        name: m.name,
        setCode: m.setCode,
        setName: m.setName,
        manaCost: m.manaCost ?? '',
        collectorNum: m.collectorNum,
        oracleText: m.oracleText ?? '',
        colorIdentity: m.colorIdentity,
        imageUrl: imageUrl,
        backsideImageUrl: undefined,
        rarity: m.rarity ?? '',
        type: m.type ?? '',
        cardKingdomUri: undefined,
        usdPrice: m.usdPrice ?? undefined,
        usdFoilPrice: m.usdFoilPrice ?? undefined,
        price: inv?.price.toString() ?? "0.00",
        stock: inv?.stock ?? 0,
        inventory: r.inventory.map((i) => ({
          id: i.id,
          price: i.price.toString(),
          stock: i.stock,
          language: i.language ?? undefined,
          condition: i.condition ?? undefined
        }))
      };
    });

  return {
    data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
