import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts-edge';
import type {JWT} from 'next-auth/jwt'
import type { Session } from 'next-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
//import type { CallbacksOptions } from 'next-auth'

type SesssionCallbackParams = {
  session: Session;
  token: JWT;
  trigger?: 'update';
  user?: any;
}


export const config = {
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-out',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  //debug: true, // helpful for logs
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const {email, password} = credentials as {
          email:string
          password: string
        }
        const user = await prisma.user.findUnique({
          where: { email},
        });

        if (user && user.password) {
          const isValid = compareSync(password, user.password);
          if (isValid) {
            return {
              id: user.id,
              name: user.name ?? '',
              email: user.email,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: any;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: any;
    }): Promise<JWT> {
      // on initial sign in, write user props into the token
      if (user) {
        token.sub   = user.id
        token.name  = user.name
        token.email = user.email
        token.role  = user.role
      }

      // on signIn or signUp merge the anonymous cart
      if ((trigger === 'signIn' || trigger === 'signUp') && user) {
        const sessionCartId = (await cookies()).get('sessionCartId')?.value;
      
        if (sessionCartId) {
          const sessionCart = await prisma.cart.findFirst({
            where: { sessionCartId }, // This is still your anonymous cart
          });
      
          if (sessionCart) {
            // Optional: Delete old cart if it exists (only if you're NOT merging)
            await prisma.cart.deleteMany({
              where: { userId: user.id },
            });
      
            // Transfer the anonymous cart to the user
            await prisma.cart.update({
              where: { id: sessionCart.id }, // Use real cart.id here
              data: { userId: user.id },
            });
          }
        }
      }
      

      // if the user has just updated their profile…
      if (trigger === 'update' && session?.user?.name) {
        token.name = session.user.name
      }

      return token
    },

    // 2) session callback, also picking up trigger & user
    async session({ session, token, trigger, user }: SesssionCallbackParams): Promise<Session> {
      session.user = {
        id:    token.sub   as string,
        name:  token.name  as string,
        email: token.email as string,
        role:  token.role  as string,
      };

      // if they just updated their profile name…
      if (trigger === 'update' && user?.name) {
        session.user.name = user.name
      }

      return session
    },
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(config);
