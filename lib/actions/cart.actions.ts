'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import { CartItem } from '@/types'
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
  // 1) Return existing user cart
  if (userId) {
    const userCart = await prisma.cart.findFirst({ where: { userId } })
    if (userCart) return userCart
  }

  // 2) Return existing guest cart
  const guestCart = await prisma.cart.findUnique({ where: { sessionCartId } })
  if (guestCart) return guestCart

  // 3) Create new guest cart with zeroed pricing
  const items: CartItem[] = []
  const pricing = await calcPrice(items)
  return prisma.cart.create({
    data: {
      sessionCartId,
      items,
      itemsPrice:   pricing.itemsPrice,
      shippingPrice: pricing.shippingPrice,
      taxPrice:     pricing.taxPrice,
      totalPrice:   pricing.totalPrice,
      ...(userId && { userId }),
    },
  })
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

/** Serialize a Prisma Cart record to plain JSON */
function serializeCart(record: Awaited<ReturnType<typeof prisma.cart.findUnique>>) {
  if (!record) return undefined
  return {
    id:             record.id,
    userId:         record.userId ?? undefined,
    sessionCartId:  record.sessionCartId,
    items:          record.items as CartItem[],
    itemsPrice:     record.itemsPrice.toString(),
    shippingPrice:  record.shippingPrice.toString(),
    taxPrice:       record.taxPrice.toString(),
    totalPrice:     record.totalPrice.toString(),
    createdAt:      record.createdAt.toISOString(),
    //updatedAt:      record.updatedAt?.toISOString() ?? null,
  }
}

/** Add a product (or increment qty) in the cart */
export async function addItemToCart(data: CartItem) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const item = cartItemSchema.parse(data)

    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error('Product not found')

    const cart = await resolveCart(sessionCartId, userId)
    const items = [...(cart.items as CartItem[])]

    const idx = items.findIndex(x => x.productId === item.productId)
    if (idx >= 0) {
      if (product.stock < items[idx].qty + 1) throw new Error('Not enough stock')
      items[idx].qty += 1
    } else {
      if (product.stock < 1) throw new Error('Not enough stock')
      items.push(item)
    }

    const pricing = await calcPrice(items)

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items,
        itemsPrice:   pricing.itemsPrice,
        shippingPrice: pricing.shippingPrice,
        taxPrice:     pricing.taxPrice,
        totalPrice:   pricing.totalPrice,
        ...(userId && { userId }),
      },
    })

    revalidatePath(`/product/${product.slug}`)
    return { success: true, message: `${product.name} added to cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

/** Fetch the current cart, optionally claiming it on login */
export async function getMyCart() {
  const { sessionCartId, userId } = await getCartIdentifiers()
  const cart = await resolveCart(sessionCartId, userId)
  return serializeCart(cart)
}

/** Decrement quantity or remove an item from cart */
export async function removeItemFromCart(productId: string) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const cart = await resolveCart(sessionCartId, userId)
    const items = (cart.items as CartItem[]).map(x => ({ ...x }))
    const idx = items.findIndex(x => x.productId === productId)
    if (idx < 0) throw new Error('Product not in cart')

    if (items[idx].qty > 1) items[idx].qty--
    else items.splice(idx, 1)

    const pricing = await calcPrice(items)

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items,
        itemsPrice:   pricing.itemsPrice,
        shippingPrice: pricing.shippingPrice,
        taxPrice:     pricing.taxPrice,
        totalPrice:   pricing.totalPrice,
      },
    })

    revalidatePath(`/product/${product.slug}`)
    return { success: true, message: `${product.name} removed from cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
