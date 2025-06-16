import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';

export async function POST(req: NextRequest) {
  try {
    const { inventoryId, newStock } = await req.json();

    if (!inventoryId || typeof newStock !== 'number') {
      throw new Error('Invalid input');
    }

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: { stock: newStock },
    });

    return NextResponse.json({
      success: true,
      updated,
      redirect: '/search',
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: formatError(err) },
      { status: 500 }
    );
  }
}
