import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url, 'http://localhost');
  const searchParams = reqUrl.searchParams;

  const q = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const type = searchParams.get('type') ?? 'both';
  const set = searchParams.get('set');

  const manaCost = searchParams.get('manaCost');
  const cardType = searchParams.get('cardType');

  const colorsParam = searchParams.get('colors') ?? '';
  const selectedColors = colorsParam.split(',').filter(Boolean);
  const colorsExact = searchParams.get('colorsExact') === 'true';

  const PAGE_SIZE = 12;

  const whereClause: Prisma.StoreProductWhereInput = {
    ...(type === 'CARD' ? { type: 'CARD' } : type === 'ACCESSORY' ? { type: 'ACCESSORY' } : {}),
    AND: [],
  };

  const andClause: Prisma.StoreProductWhereInput[] = [];

  // Full text search (more aggressive now)
  if (q) {
    andClause.push({
      OR: [
        { accessory: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { cardMetadata: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { cardMetadata: { oracleText: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { cardMetadata: { type: { contains: q, mode: Prisma.QueryMode.insensitive } } },
      ],
    });
  }

  // Set filtering
  if (set) {
    andClause.push({ cardMetadata: { setCode: set } });
  }

  // Mana cost filtering
  if (manaCost) {
    andClause.push({ cardMetadata: { manaCost: { contains: manaCost } } });
  }

  // Colors filtering
  if (selectedColors.length > 0) {
  const isColorlessSelected = selectedColors.length === 1 && selectedColors[0] === 'C';

  if (isColorlessSelected) {
    andClause.push({ cardMetadata: { colorIdentity: { equals: [] } } });
  } else if (colorsExact) {
    const sortedColors = [...selectedColors].sort();
    andClause.push({ cardMetadata: { colorIdentity: { equals: sortedColors } } });
  } else {
    andClause.push({ cardMetadata: { colorIdentity: { hasSome: selectedColors } } });
  }
}

  // Card type filtering
  if (cardType) {
    andClause.push({ cardMetadata: { type: { contains: cardType, mode: Prisma.QueryMode.insensitive } } });
  }

  // // Price filters (safe parsing)
  // const priceFilter: Prisma.StoreProductWhereInput = {};
  // if (minPrice) priceFilter.price = { ...(priceFilter.price ?? {}), gte: parseFloat(minPrice) };
  // if (maxPrice) priceFilter.price = { ...(priceFilter.price ?? {}), lte: parseFloat(maxPrice) };
  // if (Object.keys(priceFilter).length > 0) {
  //   andClause.push(priceFilter);
  // }

  if (andClause.length > 0) {
    whereClause.AND = andClause;
  }

  const [data, totalCount] = await Promise.all([
    prisma.storeProduct.findMany({
      where: whereClause,
      include: {
        accessory: true,
        cardMetadata: true,
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.storeProduct.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    data,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    currentPage: page,
  });
}
