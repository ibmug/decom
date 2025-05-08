'use server'

import { cookies }                from 'next/headers'
import { revalidatePath }         from 'next/cache'
import { getServerSession }       from 'next-auth/next'
import { authOptions }            from '@/lib/authOptions'
import { prisma }                 from '@/db/prisma'
import { CartItem }               from '@/types'
import { cartItemSchema }         from '@/lib/validators'
import { roundtwo, formatError }  from '@/lib/utils'

// --- Helpers --------------------------------------------------

/** Read sessionCartId cookie + optional userId */
async function getCartIdentifiers() {
  const store   = await cookies()
  const sessionCartId = store.get('sessionCartId')?.value
  if (!sessionCartId) throw new Error('Session Cart Id not found')

  const session = await getServerSession(authOptions)
  const userId  = session?.user?.id ?? null

  return { sessionCartId, userId }
}

/** Recompute all the price fields */
export async function calcPrice(items: CartItem[]) {
  const itemsPrice    = roundtwo(items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0))
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10)
  const taxPrice      = roundtwo(0.15 * itemsPrice)
  const totalPrice    = roundtwo(itemsPrice + taxPrice + shippingPrice)

  return {
    itemsPrice:    itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice:      taxPrice.toFixed(2),
    totalPrice:    totalPrice.toFixed(2),
  }
}

/** Serialize a Prisma Cart record to a plain JSON object */
function serializeCart(record: Awaited<ReturnType<typeof prisma.cart.findFirst>>) {
  if (!record) return undefined
  return {
    id:            record.id,
    userId:        record.userId,
    sessionCartId: record.sessionCartId,
    items:         record.items as CartItem[],
    itemsPrice:    record.itemsPrice.toString(),
    shippingPrice: record.shippingPrice.toString(),
    taxPrice:      record.taxPrice.toString(),
    totalPrice:    record.totalPrice.toString(),
    createdAt:     record.createdAt.toISOString(),
    updatedAt:     record.updatedAt?.toISOString() ?? null,
  }
}

// --- Public Actions -------------------------------------------

export async function addItemToCart(data: CartItem) {
  console.log('[server] addItemToCart called for', data.productId)
  try {
    const { sessionCartId, userId } = await getCartIdentifiers()
    const item    = cartItemSchema.parse(data)
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error('Product not found')

    // pull guest cart items if any
    const guestCart = await prisma.cart.findUnique({
      where:  { sessionCartId },
      select: { items: true },
    })

    // merge or start fresh
    const items: CartItem[] = guestCart
      ? (() => {
          const arr = JSON.parse(JSON.stringify(guestCart.items)) as CartItem[]
          const match = arr.find(x => x.productId === item.productId)
          if (match) {
            if (product.stock < match.qty + 1) {
              throw new Error('Not enough stock')
            }
            match.qty += 1
          } else {
            if (product.stock < 1) {
              throw new Error('Not enough stock')
            }
            arr.push(item)
          }
          return arr
        })()
      : [item]

    const pricing = calcPrice(items)

    await prisma.cart.upsert({
      where:  { sessionCartId },
      create: { userId, sessionCartId, items, ...pricing },
      update: { userId, items, ...pricing },
    })

    revalidatePath(`/product/${product.slug}`)

    return { success: true, message: `${product.name} added to cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

/** Add one item (or bump qty) in your cart */
/** Fetch the current cart, claiming a guest cart on login */
export async function getMyCart() {
  const { sessionCartId, userId } = await getCartIdentifiers()

  // 1) if logged in, try to find a cart by userId...
  if (userId) {
    let record = await prisma.cart.findFirst({ where: { userId } })

    // 2) if none, but there’s a guest cart, claim it:
    if (!record) {
      const guest = await prisma.cart.findUnique({ where: { sessionCartId } })
      if (guest) {
        record = await prisma.cart.update({
          where: { id: guest.id },
          data:  { userId },
        })
      }
    }

    return serializeCart(record)
  }

  // 3) otherwise return the guest cart
  const record = await prisma.cart.findUnique({ where: { sessionCartId } })
  return serializeCart(record)
}

/** Decrement or remove one item from cart */
export async function removeItemFromCart(productId: string) {
  try {
    const { sessionCartId } = await getCartIdentifiers()
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const cart = await getMyCart()
    if (!cart) throw new Error('Cart not found')

    // build updated items list
    const items = (cart.items as CartItem[]).map((x) => ({ ...x }))
    const idx   = items.findIndex((x) => x.productId === productId)
    if (idx === -1) throw new Error('Product not in cart')

    if (items[idx].qty === 1) items.splice(idx, 1)
    else                      items[idx].qty -= 1

    const pricing = calcPrice(items)
    await prisma.cart.update({
      where: { sessionCartId },
      data:  { items, ...pricing },
    })

    revalidatePath(`/product/${product.slug}`)
    return { success: true, message: `${product.name} removed from cart.` }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
