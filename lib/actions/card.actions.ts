// lib/actions/card.actions.ts

import { prisma } from "@/db/prisma";
import type { CardItem } from "@/types";
import { Prisma } from "@prisma/client";

export async function searchCards({
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

  const where: Prisma.CardProductWhereInput = {};
  if (terms.length) {
    where.OR = terms.flatMap((term) => [
      { metadata: { name:       { contains: term, mode: "insensitive" } } },
      { metadata: { type:       { contains: term, mode: "insensitive" } } },
      { metadata: { oracleText: { contains: term, mode: "insensitive" } } },
    ]);
  }

  const total = await prisma.cardProduct.count({ where });
  const rows  = await prisma.cardProduct.findMany({
    where,
    include: { metadata: true },
    skip:  (page - 1) * limit,
    take:  limit,
  });

  const data: CardItem[] = rows.map((row) => ({
    id: row.id,
    name: row.metadata.name,
    setCode: row.metadata.setCode,
    setName: row.metadata.setName,
    manaCost: row.metadata.manaCost ?? '',
    collectorNum: row.metadata.collectorNum,
    oracleText: row.metadata.oracleText ?? '',
    colorIdentity: row.metadata.colorIdentity,
    imageUrl: row.metadata.imageUrl,
    rarity: row.metadata.rarity ?? '',
    type: row.metadata.type ?? '',
    cardKingdomUri: row.metadata.cardKingdomUri ?? undefined,
    usdPrice: row.metadata.usdPrice ?? undefined,
    usdFoilPrice: row.metadata.usdFoilPrice ?? undefined,
    stock: row.stock,
    slug: row.slug ?? '',
    price: row.price.toString(),
}));

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

  // 2) fetch with metadata
  const row = await prisma.cardProduct.findFirst({
    where: { slug },
    include: { metadata: true },
  });
  if (!row) return null;

  const m = row.metadata;
  return {
    id:            row.id,
    slug:          row.slug        ?? "",
    price:         row.price.toString(),
    stock:         row.stock,
    usdPrice:      m.usdPrice      ?? undefined,
    usdFoilPrice:  m.usdFoilPrice  ?? undefined,
    name:          m.name,
    setCode:       m.setCode,
    setName:       m.setName,
    manaCost:      m.manaCost      ?? "",
    collectorNum:  m.collectorNum,
    oracleText:    m.oracleText    ?? "",
    colorIdentity: m.colorIdentity ?? "",
    imageUrl:      m.imageUrl ?? "./cardPlaceholder.png",
    rarity:        m.rarity        ?? "",
    type:          m.type          ?? "",
  };
}