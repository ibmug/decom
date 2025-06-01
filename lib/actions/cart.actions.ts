'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import {formatError } from '@/lib/utils/utils'
import { calcPrice, PriceCalcItem } from '../utils/cartUtils'
import { UICart } from '@/types'

// --- Helpers --------------------------------------------------

/** Read or create sessionCartId cookie + current userId */
async function getCartIdentifiers() {
  const store = await cookies()
  let sessionCartId = store.get('sessionCartId')?.value
  if (!sessionCartId) {
    sessionCartId = crypto.randomUUID()
    store.set('sessionCartId', sessionCartId, { path: '/', httpOnly: true })
  }
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  return { sessionCartId, userId }
}

// --- Public Actions -------------------------------------------

/** Add a product (or increment qty) in the cart */
export async function addToCart(cartId: string, storeProductId: string, quantity: number = 1) {
  try {
    await prisma.cartItem.upsert({
      where: {
        cartId_storeProductId: {
          cartId,
          storeProductId,
        },
      },
      create: {
        cartId,
        storeProductId,
        quantity,
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
    });
    revalidatePath(`/${storeProductId}`)
    return { success: true, message: `Item added to cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function claimCart(sessionCartId: string, userId: string) {
  await prisma.cart.updateMany({
    where: { sessionCartId },
    data: { userId },
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return { success: true, message: 'Card Item Quantity Updated' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

/** Get raw cart with items and store product info */
export async function getMyCart() {
  const { sessionCartId, userId } = await getCartIdentifiers();

  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
    include: {
      items: {
        include: {
          storeProduct: {
            include: {
              cardMetadata: true,
              accessory: true,
            },
          },
        },
      },
    },
  });

  return cart;
}

/** Decrement quantity or remove an item from cart */
export async function removeCartItem(itemId: string) {
  await prisma.cartItem.delete({
    where: { id: itemId },
  });
}

/** Cart shape for display */

export async function getMyCartUI(): Promise<UICart | undefined> {
  const raw = await getMyCart();
  if (!raw) return undefined;

  // 1) Build minimal array for pricing
  const priceItems: PriceCalcItem[] = raw.items.map(i => ({
    price: i.storeProduct.price.toString(),
    qty:   i.quantity,
  }));

  // 2) Compute all four formatted price fields
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcPrice(priceItems);

   // 3) Build your UI-friendly items array
  const items = raw.items.map(i => {
    const product = i.storeProduct;
    const base    = product.cardMetadata ?? product.accessory;
    return {
      id: product.id,
      name:      base?.name ?? 'Unknown',
      slug:      product.slug ?? 'unknown-slug',
      price:     product.price.toFixed(2),
      image:     base?.imageUrl ?? '/images/cardPlaceholder.png',
      productId: product.id,
      qty:       i.quantity,
    };
  });

  // 4) Return the UICart, *including* the pricing you computed
  return {
    items,
    sessionCartId: raw.sessionCartId,
    userId:        raw.userId ?? undefined,
    id:raw.id,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  } satisfies UICart;
}
