'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/db/prisma'
import { CartItem } from '@/types'
import { cartItemSchema } from '@/lib/validators'
import { roundtwo, formatError } from '@/lib/utils'

// --- Helpers --------------------------------------------------

/** Read sessionCartId cookie + optional userId */
async function getCartIdentifiers() {
  const store = await cookies()
  let sessionCartId = store.get('sessionCartId')?.value
  if (!sessionCartId) {
    // Generate new sessionCartId if missing (set cookie in your route layer)
    sessionCartId = crypto.randomUUID()
  }
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? undefined
  return { sessionCartId, userId }
}

/** Resolve the single cart record: user cart > guest cart > create new */
async function resolveCart(sessionCartId: string, userId?: string) {
  if (userId) {
    const existing = await prisma.cart.findFirst({ where: { userId } })
    if (existing) return existing
  }
  const guest = await prisma.cart.findUnique({ where: { sessionCartId } })
  if (guest) return guest
  return prisma.cart.create({ data: { sessionCartId, items: [] } })
}

// --- Public Actions -------------------------------------------

/** Recompute all price fields */
export async function calcPrice(items: CartItem[]) {
  const itemsPrice = roundtwo(
    items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)
  )
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10)
  const taxPrice = roundtwo(0.15 * itemsPrice)
  const totalPrice = roundtwo(itemsPrice + taxPrice + shippingPrice)

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  }
}

/** Serialize a Prisma Cart record to plain JSON */
function serializeCart(record: Awaited<ReturnType<typeof prisma.cart.findUnique>>) {
  if (!record) return undefined
  return {
    id: record.id,
    userId: record.userId,
    sessionCartId: record.sessionCartId,
    items: record.items as CartItem[],
    itemsPrice: record.itemsPrice.toString(),
    shippingPrice: record.shippingPrice.toString(),
    taxPrice: record.taxPrice.toString(),
    totalPrice: record.totalPrice.toString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt?.toISOString() ?? null,
  }
}

/** Add a product (or bump qty) in your cart */
export async function addItemToCart(data: CartItem) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const item = cartItemSchema.parse(data)

    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error('Product not found')

    const cartRecord = await resolveCart(sessionCartId, userId)
    const existingItems = cartRecord.items as CartItem[]
    const items = [...existingItems]

    const idx = items.findIndex(x => x.productId === item.productId)
    if (idx !== -1) {
      if (product.stock < items[idx].qty + 1) throw new Error('Not enough stock')
      items[idx].qty += 1
    } else {
      if (product.stock < 1) throw new Error('Not enough stock')
      items.push(item)
    }

    const pricing = await calcPrice(items)

    await prisma.cart.upsert({
      where: { sessionCartId },
      create: { userId, sessionCartId, items, ...pricing },
      update: { userId, items, ...pricing },
    })

    revalidatePath(`/product/${product.slug}`)
    return { success: true, message: `${product.name} added to cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

/** Fetch the current cart, claiming a guest cart on login */
export async function getMyCart() {
  const { sessionCartId, userId } = await getCartIdentifiers()
  const cartRecord = await resolveCart(sessionCartId, userId)
  return serializeCart(cartRecord)
}

/** Decrement or remove one item from cart */
export async function removeItemFromCart(productId: string) {
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const cartRecord = await resolveCart(sessionCartId, userId)
    const items = (cartRecord.items as CartItem[]).map(x => ({ ...x }))
    const idx = items.findIndex(x => x.productId === productId)
    if (idx === -1) throw new Error('Product not in cart')

    if (items[idx].qty === 1) items.splice(idx, 1)
    else items[idx].qty -= 1

    const pricing = await calcPrice(items)

    await prisma.cart.update({
      where: { id: cartRecord.id },
      data: { items, ...pricing },
    })

    revalidatePath(`/product/${product.slug}`)
    return { success: true, message: `${product.name} removed from cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
