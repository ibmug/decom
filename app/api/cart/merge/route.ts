// app/api/cart/merge/route.ts
import { NextResponse }     from 'next/server';
import { cookies }          from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';
import { prisma }           from '@/db/prisma';
import { calcPrice } from '@/lib/utils/cartUtils';


type FullItem = {
  storeProductId: string;
  qty:       number;
  price:     string;
  name:      string;
  image:     string;
  slug:      string;
};

function mergeCartItems(u: FullItem[], g: FullItem[]): FullItem[] {
  //user,guest
  const map = new Map<string, FullItem>();
  for (const it of u) map.set(it.storeProductId, { ...it });
  for (const it of g) {
    if (map.has(it.storeProductId)) {
      map.get(it.storeProductId)!.qty += it.qty;
    } else {
      map.set(it.storeProductId, { ...it });
    }
  }
  return Array.from(map.values());
}

export async function POST() {
  // 1) Auth
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

  // 2) Guest cookie
  const cookieStore = await cookies();
  const guestId = cookieStore.get('sessionCartId')?.value;
  if (!guestId || !/^[0-9a-fA-F-]{36}$/.test(guestId)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid or missing sessionCartId' },
      { status: 400 }
    );
  }

  // 3) Fetch carts
  const userId = session.user.id;
  const [guestCart, userCart] = await Promise.all([prisma.cart.findUnique({
    where: { sessionCartId: guestId },
    include: {
      items: {
        include: {
          storeProduct: {
            include: {
              cardMetadata:      true,
              accessory: true,
            }
          }
        }
      }
    }
  }),
  prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
     include: {
          storeProduct: {
            include: {
              cardMetadata:      true,
              accessory: true,
            }
          }
        }
      }
    }
  }),
])

  // Already merged or missing
  if (!guestCart || guestCart.userId) {
    const res = NextResponse.json({ ok: false });
    res.cookies.delete({ name: 'sessionCartId', path: '/' });
    return res;
  }

  // 4) Merge
  const userItems: FullItem[] = (userCart?.items ?? []).map(item => ({
  storeProductId: item.storeProductId,
  qty:       item.quantity,
  price:     item.storeProduct.price.toString(),
  name:      item.storeProduct.cardMetadata?.name ?? item.storeProduct.customName!,
  image:     item.storeProduct.cardMetadata?.imageUrl ?? '/images/fallback.png',
  slug:      item.storeProduct.slug!,
}));
    const guestItems: FullItem[] = (guestCart?.items ?? []).map(item => ({
  storeProductId: item.storeProductId,
  qty:       item.quantity,
  price:     item.storeProduct.price.toString(),
  name:      item.storeProduct.cardMetadata?.name ?? item.storeProduct.customName!,
  image:     item.storeProduct.cardMetadata?.imageUrl ?? '/images/fallback.png',
  slug:      item.storeProduct.slug!,
}));
  const mergedItems = mergeCartItems(userItems, guestItems);

  // 5) Price + upsert via update/create
  const pricing = await calcPrice(mergedItems);
  const existing = await prisma.cart.findFirst({ where: { userId } });

  if (existing) {
    // update the existing user‐cart
    await prisma.cart.update({
      where: { id: existing.id },
      data: {
        items: {
          deleteMany: {}, // remove all previous items
          create: mergedItems.map(({ storeProductId, qty }) => ({
            storeProductId: storeProductId,
            quantity: qty,
          })),
        },
        ...pricing,
      },
    });
  } else {
    // create a new cart for the user—and give it the same sessionCartId
    await prisma.cart.create({
      data: {
        userId,
        sessionCartId: guestId,    // <— this was missing
        items: {
          create: mergedItems.map(({ storeProductId, qty }) => ({
            storeProductId: storeProductId,
            quantity: qty,
          })),
        },
        ...pricing,
      },
    });
  }

  // 6) Delete guest cart
  await prisma.cart.delete({ where: { sessionCartId: guestId } });

  // 7) Build & return
  const res = NextResponse.json({ ok: true });
  res.cookies.delete({ name: 'sessionCartId', path: '/' });
  return res;
}
