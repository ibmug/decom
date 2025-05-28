'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import { roundtwo, formatError } from '@/lib/utils/utils'
import { calculateCartTotals } from '../utils/cartUtils'
import { Cart } from '@prisma/client'

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
  try{
  await prisma.newCartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
   return {success:true, message: 'Card Item Quantity Updated'}
  }catch(err){
  return {success:false, message: formatError(err)}
}



  const { itemsPrice } = await calcPrice(items); // reuse your util

  return {
    items,
    itemsPrice
  };
}





export async function getMyCart() {
  const { sessionCartId, userId } = await getCartIdentifiers();

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

export type UIOrderItem = {
  name: string;
  slug: string;
  price: string;
  image: string;
  productId: string;
  qty: number;
};

export async function getMyCartUI(): Promise<Cart | undefined> {
  const raw = await getMyCart();
  if (!raw) return undefined;

  const totals = calculateCartTotals(raw);

  const items = raw.items.map((item) => {
    const product = item.storeProduct;
    const base = product.card ?? product.accessory;
    
    return {
      name: base?.name ?? 'Unknown',
      slug: product.slug ?? 'unknown-slug', // Prevent null slug issues
      price: product.price.toFixed(2),
      image: base?.imageUrl ?? '/images/cardPlaceholder.png',
      productId: product.id,
      qty: item.quantity,
    };
  });

  return {
    ...totals,
    items,
    sessionCartId: raw.sessionCartId,
    userId: raw.userId ?? undefined,
  };
}
