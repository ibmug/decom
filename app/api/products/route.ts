// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/db/prisma';
// import { Prisma } from '@prisma/client';
// import { storeProductToUIStoreProduct } from '@/lib/utils/transformers';

// export async function GET(req: NextRequest) {
//   const reqUrl = new URL(req.url, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost');

//   const searchParams = reqUrl.searchParams;

//   const q = searchParams.get('q') ?? '';
//   const page = parseInt(searchParams.get('page') ?? '1');
//   const type = searchParams.get('type') ?? 'both';
//   const set = searchParams.get('set');
//   const manaCost = searchParams.get('manaCost');
//   const cardType = searchParams.get('cardType');

//   const colorsParam = searchParams.get('colors') ?? '';
//   const selectedColors = colorsParam.split(',').filter(Boolean);
//   const colorsExact = searchParams.get('colorsExact') === 'true';

//   const PAGE_SIZE = 12;

//   const whereClause: Prisma.StoreProductWhereInput = {
//     ...(type === 'CARD' ? { type: 'CARD' } : type === 'ACCESSORY' ? { type: 'ACCESSORY' } : {}),
//     AND: [],
//   };

//   const andClause: Prisma.StoreProductWhereInput[] = [];

//   if (q) {
//     andClause.push({
//       OR: [
//         { accessory: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
//         { cardMetadata: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
//         { cardMetadata: { oracleText: { contains: q, mode: Prisma.QueryMode.insensitive } } },
//         { cardMetadata: { type: { contains: q, mode: Prisma.QueryMode.insensitive } } },
//         { customName: { contains: q, mode: Prisma.QueryMode.insensitive } },
//       ],
//     });
//   }

//   if (set) {
//     andClause.push({ cardMetadata: { setCode: set } });
//   }

//   if (manaCost) {
//     andClause.push({ cardMetadata: { manaCost: { contains: manaCost } } });
//   }

//   if (selectedColors.length > 0) {
//     const isColorlessSelected = selectedColors.length === 1 && selectedColors[0] === 'C';

//     if (isColorlessSelected) {
//       andClause.push({ cardMetadata: { colorIdentity: { equals: [] } } });
//     } else if (colorsExact) {
//       const sortedColors = [...selectedColors].sort();
//       andClause.push({ cardMetadata: { colorIdentity: { equals: sortedColors } } });
//     } else {
//       andClause.push({ cardMetadata: { colorIdentity: { hasSome: selectedColors } } });
//     }
//   }

//   if (cardType) {
//     andClause.push({ cardMetadata: { type: { contains: cardType, mode: Prisma.QueryMode.insensitive } } });
//   }

//   if (andClause.length > 0) {
//     whereClause.AND = andClause;
//   }

//   const [data, totalCount] = await Promise.all([
//     prisma.storeProduct.findMany({
//       where: whereClause,
//       include: {
//         accessory: true,
//         cardMetadata: true,
//         inventory: true,  // <-- important: inventory is now included
//       },
//       orderBy: { updatedAt: 'desc' },
//       take: PAGE_SIZE,
//       skip: (page - 1) * PAGE_SIZE,
//     }),
//     prisma.storeProduct.count({ where: whereClause }),
//   ]);

//   // 🔧 Now apply the transformer to match new UIStoreProduct format
//   console.log(storeProductToUIStoreProduct)
//   const serializedData = data.map(storeProductToUIStoreProduct);

//   return NextResponse.json({
//     data: serializedData,
//     totalPages: Math.ceil(totalCount / PAGE_SIZE),
//     currentPage: page,
//   });
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { Prisma } from '@prisma/client';
import { storeProductToUIStoreProduct } from '@/lib/utils/transformers';

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url);
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

  if (set) {
    andClause.push({ cardMetadata: { setCode: set } });
  }

  if (manaCost) {
    andClause.push({ cardMetadata: { manaCost: { contains: manaCost } } });
  }

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

  if (cardType) {
    andClause.push({ cardMetadata: { type: { contains: cardType, mode: Prisma.QueryMode.insensitive } } });
  }

  if (andClause.length > 0) {
    whereClause.AND = andClause;
  }

  const [data, totalCount] = await Promise.all([
    prisma.storeProduct.findMany({
      where: whereClause,
      include: {
        accessory: true,
        cardMetadata: true,
        inventory: true, 
      },
      orderBy: { updatedAt: 'desc' }, // ✅ stable ordering thanks to fixed DB schema
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.storeProduct.count({ where: whereClause }),
  ]);

  const serializedData = data.map(storeProductToUIStoreProduct);

  return NextResponse.json({
    data: serializedData,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    currentPage: page,
  });
}
