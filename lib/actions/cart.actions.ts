'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import { newCartItem } from '@/types'
import { cartItemSchema } from '@/lib/validators'
import { roundtwo, formatError } from '@/lib/utils/utils'

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

/** Resolve or initialize a cart: user cart > guest cart > create new */
async function resolveCart(sessionCartId: string, userId?: string) {
  if (userId) {
    const userCart = await prisma.newCart.findFirst({ where: { userId } })
    if (userCart) return userCart
  }

  const guestCart = await prisma.newCart.findUnique({ where: { sessionCartId } })
  if (guestCart) return guestCart

  return prisma.newCart.create({
    data: {
      sessionCartId,
      ...(userId && { userId }),
    },
  })
}



export function calculateCartTotals(cart: Awaited<ReturnType<typeof getMyCart>>) {
  const itemsPrice = cart?.items.reduce((acc, item) => {
    return acc + Number(item.storeProduct.price) * item.quantity;
  }, 0) ?? 0;

  const shippingPrice = itemsPrice > 100 ? 0 : 100;
  const taxPrice = 0.15 * itemsPrice;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
}

// --- Public Actions -------------------------------------------

/** Recompute all price fields */
export async function calcPrice(items: CartItem[]) {
  const itemsValue = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)
  const itemsPrice = roundtwo(itemsValue)
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10)
  const taxPrice = roundtwo(0.15 * itemsPrice)
  const totalPrice = roundtwo(itemsPrice + shippingPrice + taxPrice)

  return {
    itemsPrice:   itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice:     taxPrice.toFixed(2),
    totalPrice:   totalPrice.toFixed(2),
  }
}

/** Add a product (or increment qty) in the cart */
export async function addToCart(cartId: string, storeProductId: string, quantity: number = 1) {

  try{
  await prisma.newCartItem.upsert({
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
  return { success:true, message: `Item added to cart.`}
} catch(err){
       return { success: false, message: formatError(err) }
}
}

export async function claimCart(sessionCartId: string, userId: string) {
  await prisma.newCart.updateMany({
    where: { sessionCartId },
    data: { userId },
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  await prisma.newCartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}


/** Fetch the current cart, optionally claiming it on login */
export async function getMyCart(userId: string | null, sessionCartId: string) {
  const cart = await prisma.newCart.findFirst({
    where: userId ? { userId } : { sessionCartId },
    include: {
      items: {
        include: {
          storeProduct: {
            include: {
              card: true,
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
  await prisma.newCartItem.delete({
    where: { id: itemId },
  });
}