// lib/actions/card.actions.ts

import { prisma } from "@/db/prisma";
import type { CardItem } from "@/types";
import { Prisma } from "@prisma/client";

export async function searchCardsAction({
  query = "",
  page  = 1,
  limit = 12,
}: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data:        CardItem[];
  totalPages:  number;
  currentPage: number;
}> {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  const cardWhere: Prisma.CardMetadataWhereInput = {};
  if (terms.length) {
    cardWhere.OR = terms.map(term => ({
      name: { contains: term, mode: "insensitive" },
    }));
  }

  const where: Prisma.StoreProductWhereInput = {
    type: "CARD",
    card: {
      is: cardWhere,
    },
  };

  const total = await prisma.storeProduct.count({ where });
  console.log(`The total of results: ${total}`);
  const rows = await prisma.storeProduct.findMany({
    where,
    include: { card: true },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows
  .filter((r) => r.card) // only check for presence of card
  .map((r) => {
    const m = r.card!; // card is already CardMetadata
    return {
      id:             r.id,
      slug:           r.slug ?? '',
      stock:          r.stock,
      price:          r.price.toString(),

      name:           m.name,
      setCode:        m.setCode,
      setName:        m.setName,
      manaCost:       m.manaCost ?? '',
      collectorNum:   m.collectorNum,
      oracleText:     m.oracleText ?? '',
      colorIdentity:  m.colorIdentity,
      imageUrl:       m.imageUrl,
      rarity:         m.rarity ?? '',
      type:           m.type ?? '',
      cardKingdomUri: m.cardKingdomUri ?? undefined,
      usdPrice:       m.usdPrice ?? undefined,
      usdFoilPrice:   m.usdFoilPrice ?? undefined,
    };
  });

  const totalPages = Math.ceil(total / limit);
  return { data, totalPages, currentPage: page };
}

export async function getSingleCardBySlug(
  rawSlug: string
): Promise<CardItem | null> {
  // 1) normalize incoming slug
  const decoded = decodeURIComponent(rawSlug);
  const slug = decoded
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/['"]/g, "")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // 2) fetch with card metadata
  const row = await prisma.storeProduct.findFirst({
    where: { slug, type: "CARD" },
    include: { card: true },
  });
  if (!row || !row.card) return null;

  const m = row.card;
  return {
    id:            row.id,
    slug:          row.slug ?? "",
    price:         row.price.toString(),
    stock:         row.stock,
    usdPrice:      m.usdPrice ?? undefined,
    usdFoilPrice:  m.usdFoilPrice ?? undefined,
    name:          m.name,
    setCode:       m.setCode,
    setName:       m.setName,
    manaCost:      m.manaCost ?? "",
    collectorNum:  m.collectorNum,
    oracleText:    m.oracleText ?? "",
    colorIdentity: m.colorIdentity ?? [],
    imageUrl:      m.imageUrl ?? "/images/cardPlaceholder.png",
    rarity:        m.rarity ?? "",
    type:          m.type ?? "",
  };
}
