import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { formatError } from '@/lib/utils/utils';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { guestCartId } = await req.json();
    if (!guestCartId) {
      return NextResponse.json({ success: false, message: 'Missing guestCartId' }, { status: 400 });
    }

    const cartItemIncludes: Prisma.CartItemInclude = {
      storeProduct: { include: { cardMetadata: true, accessory: true } },
      inventory: true,
    };

    const guestCart = await prisma.cart.findUnique({
      where: { id: guestCartId },
      include: {
        items: {
          include: cartItemIncludes,
        },
      },
    });

    if (!guestCart) {
      return NextResponse.json({ success: false, message: 'Guest cart not found' }, { status: 404 });
    }

    const userCart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: cartItemIncludes,
        },
      },
    });

    if (!userCart) {
      return NextResponse.json({ success: false, message: 'User cart not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Cart merge logic still pending!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: formatError(err) }, { status: 500 });
  }
}
