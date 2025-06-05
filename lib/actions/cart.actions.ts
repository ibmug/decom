'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import { formatError } from '@/lib/utils/utils'
import { calcPrice, PriceCalcItem, serializeCart } from '@/lib/utils/cartUtils'


//type CartWithItems = Prisma.CartGetPayload<{ include: { items: {include:{storeProduct: true}} } }>
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
// async function resolveCart(sessionCartId: string, userId?: string): Promise<CartWithItems> {
//   if (userId) {
//     const userCart = await prisma.cart.findFirst({ where: { userId }, include: {items:{ include: {storeProduct: true}} }})
//     if (userCart) return userCart
//   }

//   const guestCart = await prisma.cart.findFirst({
//   where: { sessionCartId },
//   include: { items: { include: { storeProduct: true } } },
// })

//   if (guestCart) return guestCart

//   const pricing = await calcPrice([])
//   return prisma.cart.create({
//     data: {
//       sessionCartId,
//       itemsPrice:    pricing.itemsPrice,
//       shippingPrice: pricing.shippingPrice,
//       taxPrice:      pricing.taxPrice,
//       totalPrice:    pricing.totalPrice,
//       ...(userId && { userId }),
//     },
//     include:{
//       items: {include: {storeProduct: true}}
//     }
//   })
// }


// export async function resolveCart(sessionCartId: string, userId?: string) {
//   let validUserId: string | undefined = undefined;

//   if (userId) {
//     const existingUser = await prisma.user.findUnique({ where: { id: userId } });
//     if (existingUser) {
//       validUserId = userId;
//     } else {
//       console.warn(` resolveCart: userId "${userId}" does not exist. Skipping user association.`);
//     }
//   }

//   return await prisma.cart.upsert({
//     where: { sessionCartId },
//     update: {},
//     create: {
//       sessionCartId,
//       ...(validUserId && { userId: validUserId }),
//     },
//   });
// }

export async function resolveCart(sessionCartId: string, userId?: string) {
  const existingCart = await prisma.cart.findFirst({
    where: {
      OR: [
        { sessionCartId },
        ...(userId ? [{ userId }] : []),
      ],
    },
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

  if (existingCart) return existingCart;

  return prisma.cart.create({
    data: {
      sessionCartId,
      ...(userId && { userId }),
    },
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
}


// --- Public Actions -------------------------------------------

/** Add a product (or increment qty) in the cart */
export async function addItemToCart(data: { productId: string; qty?: number }) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const prod = await prisma.storeProduct.findUnique({
  where: { id: data.productId },
  include: {
    cardMetadata: true,
    accessory: true,
  },
})
    if (!prod) throw new Error('Product not found')

    const cart = await resolveCart(sessionCartId, userId)
    const existingItems = cart.items.map(item => ({
  storeProductId: item.storeProductId,
  qty: item.quantity,
  price: item.storeProduct.price.toString(),
}))
    const items = [...existingItems]
    const idx = items.findIndex(x => x.storeProductId === data.productId)
    if (idx >= 0) {
      if (prod.stock < items[idx].qty + 1) throw new Error('Not enough stock')
      items[idx].qty += 1
    } else {
      if (prod.stock < 1) throw new Error('Not enough stock')
      items.push({ storeProductId: data.productId, qty: 1, price: prod.price.toString() })
    }

    const pricing = await calcPrice(
      items.map(i => ({ price: i.price, qty: i.qty } as PriceCalcItem))
    )

    const userExists = userId
  ? await prisma.user.findUnique({ where: { id: userId } })
  : null;

    await prisma.cart.update({
  where: { id: cart.id },
  data: {
    items: {
      deleteMany: {}, // Remove all existing cart items
      create: items.map(i => ({
        storeProductId: i.productId,
        quantity: i.qty,
      })),
    },
    itemsPrice: pricing.itemsPrice,
    shippingPrice: pricing.shippingPrice,
    taxPrice: pricing.taxPrice,
    totalPrice: pricing.totalPrice,
    ...(userExists && { userId }),
  },
})

    revalidatePath(`/product/${prod.slug}`)
    return { success: true, message: `${prod.customName} added to cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

/** Fetch the current cart (raw), no UI formatting */
export async function getMyCart(): Promise<ReturnType<typeof serializeCart>> {
  const { sessionCartId, userId } = await getCartIdentifiers()
  const cart = await resolveCart(sessionCartId, userId)
  return serializeCart(cart)
}

/** Decrement quantity or remove an item from cart */
export async function removeItemFromCart(productId: string) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const prod = await prisma.product.findUnique({ where: { id: productId } })
    if (!prod) throw new Error('Product not found')

    const cart = await resolveCart(sessionCartId, userId)
    const items = cart.items.map(item => ({
  storeProductId: item.storeProductId,
  qty: item.quantity,
  price: item.storeProduct.price.toString(),
}))
    const idx = items.findIndex(x => x.storeProductId === productId)
    if (idx < 0) throw new Error('Product not in cart')

    if (items[idx].qty > 1) {
      items[idx].qty -= 1
    } else {
      items.splice(idx, 1)
    }

    const pricing = await calcPrice(
      items.map(i => ({ price: i.price, qty: i.qty } as PriceCalcItem))
    )

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: {
  deleteMany: {},
  create: items.map(i => ({
    storeProductId: i.storeProductId,
    quantity: i.qty,
  })),
}
,
        itemsPrice:    pricing.itemsPrice,
        shippingPrice: pricing.shippingPrice,
        taxPrice:      pricing.taxPrice,
        totalPrice:    pricing.totalPrice,
      },
    })

    revalidatePath(`/product/${prod.slug}`)
    return { success: true, message: `${prod.name} removed from cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}




export async function updateCartItemQuantity(productId: string, newQty: number) {
  const { sessionCartId, userId } = await getCartIdentifiers()
  const cart = await resolveCart(sessionCartId, userId)

  const items = cart.items.map(item => ({
    storeProductId: item.storeProductId,
    qty: item.quantity,
    price: item.storeProduct.price.toString(),
  }))

  let idx = items.findIndex(x => x.storeProductId === productId)

  if (idx < 0 && newQty > 0) {
    const prod = await prisma.storeProduct.findUnique({ where: { id: productId } })
    if (!prod) throw new Error('Product not found')
    if (prod.stock < newQty) throw new Error('Not enough stock')

    items.push({ storeProductId: productId, qty: newQty, price: prod.price.toString() })
  }

  // 🔁 Recalculate index after possible push
  idx = items.findIndex(x => x.storeProductId === productId)

  if (newQty <= 0) {
    items.splice(idx, 1)
  } else {
    items[idx].qty = newQty
  }

  const pricing = await calcPrice(items.map(i => ({ price: i.price, qty: i.qty })))

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      items: {
        deleteMany: {}, // optionally clear old items
        create: items.map(i => ({
          storeProductId: i.storeProductId,
          quantity: i.qty,
        })),
      },
      itemsPrice: pricing.itemsPrice,
      shippingPrice: pricing.shippingPrice,
      taxPrice: pricing.taxPrice,
      totalPrice: pricing.totalPrice,
    },
  })

  return { success: true }
}

