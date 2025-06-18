import { prisma } from "@/db/prisma";
import { CardItem, UIStoreProduct } from "@/types";
import { Prisma } from "@prisma/client";
import { storeProductToUIStoreProduct, toCardItem } from "@/lib/utils/transformers";

// Shared select for cardMetadata (✅ full fields required by transformer)
const cardMetadataSelect = {
  id: true,
  name: true,
  oracleText: true,
  setCode: true,
  setName: true,
  manaCost: true,
  cmc: true,
  collectorNum: true,
  colorIdentity: true,
  type: true,
  rarity: true,
  usdPrice: true,
  usdFoilPrice: true,
  scryfallId: true,
  oracleId: true,
  cardKingdomUri: true,
} as const;

// --- Get Single Card by Slug ---

export async function getSingleCardBySlug(slug: string): Promise<UIStoreProduct | null> {
  const raw = await prisma.storeProduct.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      type: true,
      price: true,
      rating: true,
      numReviews: true,
      images: true,
      cardMetadata: { select: cardMetadataSelect },
      inventory: {
        select: {
          id: true,
          stock: true,
          language: true,
          condition: true,
        },
      },
    },
  });

  if (!raw || raw.type !== "CARD" || !raw.cardMetadata) return null;

  return storeProductToUIStoreProduct({
    ...raw,
    inventory: raw.inventory,
    price: raw.price,
  });
}

// --- Search Cards with Pagination ---

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
    type: "CARD",
    cardMetadata: { is: metadataWhere },
  };

  const total = await prisma.storeProduct.count({ where });

  const rows = await prisma.storeProduct.findMany({
    where,
    select: {
      id: true,
      slug: true,
      type: true,
      price: true,
      rating: true,
      numReviews: true,
      images: true,
      cardMetadata: { select: cardMetadataSelect },
      inventory: {
        select: {
          id: true,
          stock: true,
          language: true,
          condition: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows
    .filter((r) => r.cardMetadata)
    .map((r) => {
      const product = storeProductToUIStoreProduct({
        ...r,
        inventory: r.inventory,
        price: r.price,
      });

      return toCardItem(product as Extract<UIStoreProduct, { type: "CARD" }>);

    });

  return {
    data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
