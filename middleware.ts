// middleware.ts
import { NextResponse }   from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken }       from 'next-auth/jwt';

const protectedPaths = [
  /^\/shipping-address/,
  /^\/payment-method/,
  /^\/place-order/,
  /^\/profile/,
  /^\/user\/.*$/,
  /^\/order\/.*$/,
  /^\/admin(?:\/.*)?$/,
  /^\/api\/user\/.*$/,
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // --- cart cookie (unchanged) ---
  if (!req.cookies.get('sessionCartId')) {
    res.cookies.set('sessionCartId', crypto.randomUUID(), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // --- auth guard ---
  const { pathname } = req.nextUrl;
  const needsAuth = protectedPaths.some((rx) => rx.test(pathname));

  if (needsAuth) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production', // ← add this
    });

    if (!token) {
      if (!pathname.startsWith('/api')) {
        const url = new URL('/sign-in', req.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico).*)',  // protect everything except Next internals + favicon
    '/api/user/:path*',            // and your user-API
  ],
};
