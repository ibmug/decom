import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'     // edge-safe helper

///Consider protecting the order, the user's profile ONCE the user is signed. 
//ex, john cannot access another user's profile or another order he isnt assigned to.

const protectedPaths = [
  /^\/shipping-address/,
  /^\/payment-method/,
  /^\/place-order/,
  /^\/profile/,
  /^\/user\/.*$/,
  /^\/order\/.*$/,
  /^\/admin(?:\/.*)?$/,
]

const makeUUID = () => crypto.randomUUID()

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ----- anonymous cart cookie -----
  if (!req.cookies.get('sessionCartId')) {
    res.cookies.set('sessionCartId', makeUUID(), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  // ----- auth guard (edge-safe) -----
  const { pathname } = req.nextUrl
  const needsAuth = protectedPaths.some((rx) => rx.test(pathname))

  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const url = new URL('/sign-in', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
