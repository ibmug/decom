
import { NextResponse }       from 'next/server'
import { cookies }            from 'next/headers'
import { getServerSession }   from 'next-auth/next'
import { authOptions }        from '@/lib/authOptions'
import { prisma }             from '@/db/prisma'
import { calcPrice } from '@/lib/actions/cart.actions'

type FullItem = {
    productId: string
    qty:       number
    price:     string
    name:      string
    image:     string
    slug:      string
  }
  
  function mergeCartItems(userItems: FullItem[], guestItems: FullItem[]): FullItem[] {
    const map = new Map<string, FullItem>()
    // 1) seed map with user’s existing items
    for (const it of userItems) {
      map.set(it.productId, { ...it })
    }
    // 2) merge in guest items
    for (const it of guestItems) {
      if (map.has(it.productId)) {
        map.get(it.productId)!.qty += it.qty
      } else {
        map.set(it.productId, { ...it })
      }
    }
    return Array.from(map.values())
  }

export async function POST() {
  // 1) Auth check
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  // 2) Read & validate the guest-cart cookie
  const cookieStore = await cookies()
  const guestId     = cookieStore.get('sessionCartId')?.value
  if (!guestId || !/^[0-9a-fA-F-]{36}$/.test(guestId)) {
    return NextResponse.json({ ok: false, error: 'Invalid or missing sessionCartId' }, { status: 400 })
  }

  // 3) Fetch both carts
  const userId = session.user.id
  const [guestCart, userCart] = await Promise.all([
    prisma.cart.findUnique({ where: { sessionCartId: guestId }, include: { items: true } }),
    prisma.cart.findUnique({ where: { userId         : userId  }, include: { items: true } }),
  ])

  // If no guest cart or it’s already tied to a user, just clear the cookie
  if (!guestCart || guestCart.userId) {
    const res = NextResponse.json({ ok: false })
    res.cookies.delete({name:'sessionCartId', path: '/'})
    return res
  }

  // 4) Merge items
  const mergedItems = mergeCartItems(userCart?.items ?? [], guestCart.items)

  // 5) Upsert merged cart under the user’s ID
  const pricing = await calcPrice(mergedItems)
  await prisma.cart.upsert({
    where:  { userId },
    create: { userId, items: mergedItems, ...pricing },
    update: { items: mergedItems, ...pricing },
  })

  // 6) Delete the old guest cart record
  await prisma.cart.delete({ where: { sessionCartId: guestId } })

  // 7) Build the response and clear the cookie
  const res = NextResponse.json({ ok: true })
  res.cookies.delete({name:'sessionCartId', path:'/'})
}
