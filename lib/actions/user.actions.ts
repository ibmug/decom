// File: lib/actions/user.actions.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';
import { signIn, signOut }   from 'next-auth/react';
import { z } from 'zod';
import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
} from '@/lib/validators';
import { hashSync } from 'bcrypt-ts-edge';
import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils';
import type { ShippingAddress } from '@/types';

// Sign in the user with credentials
export async function signInWithCredentials(_prevState: unknown, formData: FormData) {
  try {
    const creds = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      redirect: false,
      email: creds.email,
      password: creds.password,
    });

    return { success: true, message: 'Signed in successfully' };
  } catch {
    return { success: false, message: 'Invalid credentials' };
  }
}

// Sign user out
export async function signOutUser() {
  await signOut({ redirect: false });
}

// Sign up user
export async function signUpUser(_prevState: unknown, formData: FormData) {
  try {
    const userData = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const raw = userData.password;
    userData.password = hashSync(userData.password, 10);

    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
    });

    await signIn('credentials', {
      redirect: false,
      email: userData.email,
      password: raw,
    });

    return { success: true, message: 'User registered successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return user;
}

// Update user address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Not authenticated');
    const userId = session.user.id;

    const address = shippingAddressSchema.parse(data);
    await prisma.user.update({
      where: { id: userId },
      data: { address },
    });

    return { success: true, message: 'Address updated.' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update payment method
export async function updateUserPayment(data: z.infer<typeof paymentMethodSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Not authenticated');
    const userId = session.user.id;

    const { type } = paymentMethodSchema.parse(data);
    await prisma.user.update({
      where: { id: userId },
      data: { paymentMethod: type },
    });

    return { success: true, message: 'Payment method updated.' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}