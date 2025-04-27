// File: lib/authOptions.ts

import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { compareSync } from 'bcrypt-ts-edge';
import type { JWT }     from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { isSafeRedirect } from './utils';
import type { NextAuthOptions } from 'next-auth';


export const authOptions: NextAuthOptions = {
  secret:process.env.NEXTAUTH_SECRET,
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
      async authorize(creds) {
        if (!creds) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (user && user.password && compareSync(creds.password, user.password)) {
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async redirect({url, baseUrl}: {url: string; baseUrl: string}): Promise<string> {
      return isSafeRedirect(url) ? url : baseUrl;
    },
    async jwt({ token, user }: { token: JWT; user?: { id: string; name: string; email: string; role: string } }
    ): Promise<JWT>{
      if (user) {
        token.sub   = user.id;
        token.name  = user.name;
        token.email = user.email;
        token.role  = user.role;
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
