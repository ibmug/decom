import { error } from 'console';
import NextAuth from 'next-auth';
import {PrismaAdapter} from '@auth/prisma-adapter'
import { prisma } from '@/db/prisma';
import CredentialsProvider from 'next-auth/providers/credentials'
import { compareSync } from 'bcrypt-ts-edge';
import type { NextAuthConfig } from 'next-auth';

export const config = {
    pages:{
        signIn: '/sign-in',
        signOut: '/sign-out',
        error: '/sign-in',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30* 24 * 60 * 60 //30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [CredentialsProvider({
        credentials:{
            email:{type: 'email'},
            password: {type: 'password'}
        },
        async authorize(credentials){
            if(credentials == null) return null;
            //Find user in db
            const user = await prisma.user.findFirst({
                where: {
                    email: credentials.email as string
                }
            })
            //Check if user exists
            if (user && user.password){
                const isMatch = compareSync(credentials.password as string, user.password)
                //if pass is correct return user
                if(isMatch){
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            }
            //If user doesn't exists or mismatch then return null
            return null;
        }
    })],
    callbacks: {
        async session({session, user, trigger, token }: any){
            //Set user id from the token
            session.user.id = token.sub;
            //if there is an update, set the user name
            if(trigger ==='update'){
                session.user.name = user.name;
            }

            return session
        }
    }
  //'Satisfies' makes sure that the export is compatible with NextAuthConfig(or whatever type you set to satisfy)  
}satisfies NextAuthConfig;

export const {handlers, auth, signIn, signOut} = NextAuth(config);