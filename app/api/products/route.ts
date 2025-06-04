
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const reqUrl = new URL(req.url, 'http://localhost')  // origin is required here
const searchParams = reqUrl.searchParams

  //const { searchParams } = new URL(req.url)

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

  const whereClause: Prisma.StoreProductWhereInput = {
    AND: [],
  }

  if (type === 'CARD') {
    whereClause.type = 'CARD'
  } else if (type === 'ACCESSORY') {
    whereClause.type = 'ACCESSORY'
  }

  if (q) {
    whereClause.AND!.push({
      OR: [
        { accessory: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        { cardMetadata: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } }
      ]
    })
  }

  if (set) {
    whereClause.AND!.push({ cardMetadata: { is: { setCode: { equals: set } } } })
  }

  if (manaCost) {
    whereClause.AND!.push({ cardMetadata: { is: { manaCost: { contains: manaCost } } } })
  }

  if (selectedColors.length > 0) {
  if (colorsExact) {
    // Must contain ALL selected colors AND have NO others
    whereClause.AND!.push({
      cardMetadata: {
        is: {
          colorIdentity: {
            equals: [...selectedColors].sort((a, b) => a.localeCompare(b)),
          },
        },
      },
    })
  } else {
    // Matches ANY of the selected colors
    whereClause.AND!.push({
      OR: selectedColors.map((c) => ({
        cardMetadata: {
          is: {
            colorIdentity: {
              has: c,
            },
          },
        },
      })),
    })
  }
}

  if (cardType) {
    whereClause.AND!.push({ cardMetadata: { is: { type: { contains: cardType, mode: Prisma.QueryMode.insensitive } } } })
  }

  if (minPrice) {
    whereClause.AND!.push({ price: { gte: parseFloat(minPrice) } })
  }

  if (maxPrice) {
    whereClause.AND!.push({ price: { lte: parseFloat(maxPrice) } })
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
console.log('WHERE CLAUSE:', JSON.stringify(whereClause, null, 2));

  return NextResponse.json({
    data,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    currentPage: page,
  })
}
