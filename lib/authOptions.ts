// File: lib/authOptions.ts

import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { compareSync } from 'bcrypt-ts-edge';
import type { JWT }     from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { isSafeRedirect } from './utils/utils';
import type { NextAuthOptions } from 'next-auth';



  // A simple in-memory map: IP → { count: number; lastAttempt: number }
  const loginAttempts = new Map<string,{ count: number; lastAttempt: number }>();

  // Rate-limit config
  const MAX_LOGIN_ATTEMPTS = 5;
  const WINDOW_MS         = 60 * 1000; // 1 minute

export const authOptions: NextAuthOptions = {




  secret:process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) { console.error('[next-auth][error]', code, metadata) },
    warn(code)            { console.warn( '[next-auth][warn]' , code) },
    debug(code, metadata) { console.debug( '[next-auth][debug]', code, metadata) },
  },
  pages: {
    signIn:  '/sign-in',
    signOut: '/sign-out',
    error:   '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge:   30 * 24 * 60 * 60,
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(
        credentials?: Record<'email' | 'password', string>,
        req?: { headers?: Record<string, string> }
      ) {
        // 0) Must have credentials
        console.warn("authorize() got credentials:", credentials)
        if (!credentials?.email || !credentials.password) return null;
    
        // 1) Rate-limit by IP
        const headers   = req?.headers;
        const forwarded = headers?.['x-forwarded-for'];
        const host      = headers?.['host'];
        const ipHeader  = forwarded || host || 'unknown';
        const ip        = ipHeader.split(',')[0];
    
        const now   = Date.now();
        const entry = loginAttempts.get(ip) ?? { count: 0, lastAttempt: now };
        if (now - entry.lastAttempt > WINDOW_MS) entry.count = 0;
        entry.count++;
        entry.lastAttempt = now;
        loginAttempts.set(ip, entry);
    
        
    
        if (entry.count > MAX_LOGIN_ATTEMPTS) {
          console.warn(
            `[RateLimit] Login blocked for IP ${ip} — ${entry.count} attempts within ${WINDOW_MS}ms`
          );
          throw new Error('Too many login attempts. Please try again later.');
        }
    
        // 2) Check credentials
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (user && user.password && compareSync(credentials.password, user.password)) {
          console.warn("Comparison was succesful")
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } else {
          console.warn("Comparison was NOT succesful")
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async redirect({url, baseUrl}: {url: string; baseUrl: string}): Promise<string> {
      return isSafeRedirect(url) ? url : baseUrl;
    },
    async jwt({ token, user,trigger,session }: {
      token: JWT
      user?: { id: string; name: string; email: string; role: string }
      trigger?: 'signIn' | 'signUp' | 'update'
      session?: Partial<Session>
    } ): Promise<JWT>{
      if (user) {
        token.sub   = user.id;
        token.name  = user.name;
        token.email = user.email;
        token.role  = user.role;
      }
      if(session?.user && trigger === 'update'){
        token.name = session.user.name as string
        token.email = session.user.email as string
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }
    ): Promise<Session> {
      session.user = {
        id:    token.sub   as string,
        name:  token.name  as string,
        email: token.email as string,
        role:  token.role  as string,
      };
      return session;
    },
  },
};



export type AuthOptions = typeof authOptions;
