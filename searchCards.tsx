import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { CardItem } from '@/types';

export async function searchCards({ query = '', page = 1, limit = 12 }: {
  query?:  string;
  page?:   number;
  limit?:  number;
}): Promise<{ data: CardItem[]; totalPages: number; currentPage: number }> {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const where: Prisma.CardWhereInput = {};
  if (terms.length) {
    where.OR = terms.flatMap(term => [
      { name:        { contains: term, mode: 'insensitive' } },
      { type:        { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]);
  }
  const total = await prisma.card.count({ where });
  const rows  = await prisma.card.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });
  const data: CardItem[] = rows.map(r => ({
    id:          r.id,
    name:        r.name,
    type:        r.type,
    description: r.description,
    image:       r.image,
  }));
  return { data, totalPages: Math.ceil(total/limit), currentPage: page };
}