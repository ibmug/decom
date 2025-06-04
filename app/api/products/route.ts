// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const PAGE_SIZE = 12

const whereClause = q
  ? {
      OR: [
        { accessory: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        { cardMetadata: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } }
      ]
    }
  : {};

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

  return NextResponse.json({
    data,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    currentPage: page,
  })
}
