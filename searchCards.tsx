import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { CardItem } from '@/types';

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

  const where: Prisma.CardProductWhereInput = {
    metadata: {
      is: metadataWhere,
    },
  };

  const total = await prisma.cardProduct.count({ where });

  const rows = await prisma.cardProduct.findMany({
    where,
    include: { metadata: true },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows.map((r) => {
    const m = r.metadata;
    return {
      // Store-specific (CardProduct)
      id:             r.id,
      slug:           r.slug ?? '',
      stock:          r.stock,
      price:          r.price.toString(),

      // Card info (CardMetadata)
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

  return {
    data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}
