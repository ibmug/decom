import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url, 'http://localhost')
  const searchParams = reqUrl.searchParams

  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const type = searchParams.get('type') ?? 'both'
  const set = searchParams.get('set')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const manaCost = searchParams.get('manaCost')
  const cardType = searchParams.get('cardType')

  const colorsParam = searchParams.get('colors') ?? ''
  const selectedColors = colorsParam.split(',').filter(Boolean)
  const colorsExact = searchParams.get('colorsExact') === 'true'

  const PAGE_SIZE = 12

  const whereClause: Prisma.StoreProductWhereInput = {}
  const andClause: Prisma.StoreProductWhereInput[] = []

  if (type === 'CARD') {
    whereClause.type = 'CARD'
  } else if (type === 'ACCESSORY') {
    whereClause.type = 'ACCESSORY'
  }

  if (q) {
    andClause.push({
      OR: [
        { accessory: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        { cardMetadata: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } }
      ]
    })
  }

  if (set) {
    andClause.push({ cardMetadata: { is: { setCode: { equals: set } } } })
  }

  if (manaCost) {
    andClause.push({ cardMetadata: { is: { manaCost: { contains: manaCost } } } })
  }

 if (selectedColors.length > 0) {
  if (colorsExact) {
  andClause.push({
    cardMetadata: {
      is: {
        AND: [
          {
            colorIdentity: {
              hasEvery: selectedColors,
            },
          },
          {
            // Ensures no extra colors are present
            colorIdentity: {
              equals: selectedColors.sort(),
            },
          },
        ],
      },
    },
  });
}

}

  if (cardType) {
    andClause.push({ cardMetadata: { is: { type: { contains: cardType, mode: Prisma.QueryMode.insensitive } } } })
  }

  if (minPrice) {
    andClause.push({ price: { gte: parseFloat(minPrice) } })
  }

  if (maxPrice) {
    andClause.push({ price: { lte: parseFloat(maxPrice) } })
  }

  if (andClause.length > 0) {
    whereClause.AND = andClause
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
  ])

  console.log("Color Params:", {
    raw: searchParams.get('colors'),
    selectedColors,
    colorsExact,
  })
  console.log('WHERE CLAUSE:', JSON.stringify(whereClause, null, 2))

  return NextResponse.json({
    data,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    currentPage: page,
  })
}
