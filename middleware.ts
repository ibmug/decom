// middleware.ts
import {NextResponse, NextRequest} from 'next/server'
import { getToken }       from 'next-auth/jwt';
import { signIn } from 'next-auth/react';


const PROTECTED_PATHS = [
  /^\/shipping-address/,
  /^\/payment-method/,
  /^\/place-order/,
  /^\/profile/,
  /^\/user\/.*$/,
  /^\/order\/.*$/,
  /^\/admin(?:\/.*)?$/,
  /^\/api\/user\/.*$/,
];

const NEXTAUTH_URL = process.env.NEXTAUTH_URL!;

//Helper to validate redirects
function isSafeRedirect(url: string): boolean{
  try {
    // base = e.g. https://your-domain.com
    const base = new URL(NEXTAUTH_URL);
    // dest = absolute URL if path is relative, or parses full URL
    const dest = new URL(url, base);
    return dest.origin === base.origin;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // --- cart cookie
  if (!req.cookies.get('sessionCartId')) {
    res.cookies.set('sessionCartId', globalThis.crypto.randomUUID(), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 30,
    });
  }

  // --- auth guard ---
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PATHS.some((rx) => rx.test(pathname));

  if (needsAuth) {
    const token = await getToken({
      req,
      secret:       process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    if (!token) {
      // only for page requests, redirect to sign-in
      if (!pathname.startsWith('/api')) {
        //sanitize full url
        const fullUrl = req.nextUrl.toString();
        const callbackUrl =isSafeRedirect(fullUrl) ? fullUrl : '/';
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('callbackUrl', callbackUrl);
        return NextResponse.redirect(signInUrl);
      }

      // for API calls, return 401
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    //logged in but not an admin

    if(pathname.startsWith('/admin') && token.role !=='admin'){
      console.log(`[${new Date().toISOString()}] Unauthorized admin access by: ${token.name ?? 'unknown'}`)
      const homeUrl = new URL('/unauthorized', req.url)
      return NextResponse.redirect(homeUrl)
    }

  }

  return res;
}

export const config = {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico).*)',  // protect everything except Next internals
      '/api/user/:path*',                                // and your user-API
    ],
  };
