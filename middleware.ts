/*import NextAuth from 'next-auth';
import {authConfig} from './auth.config';

export const {auth: middleware} = NextAuth(authConfig);*/

import { NextRequest, NextResponse } from 'next/server';


function generateUUID() {
    return crypto.randomUUID();
  }
  

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const sessionCartId = request.cookies.get("sessionCartId");

  if (!sessionCartId) {
    const newId = generateUUID();
    response.cookies.set("sessionCartId", newId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
