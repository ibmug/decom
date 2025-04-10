import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync } from 'bcrypt-ts-edge';

export const config = {
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-out',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.password) {
          const isValid = compareSync(credentials.password, user.password);
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? '';
        token.name = user.name ?? '';
        token.email = user.email ?? '';
        token.role = user.role ?? 'user';
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.sub ?? '',
        name: token.name ?? 'Guest',
        email: token.email ?? '',
        role: token.role ?? 'user',
      };

      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
