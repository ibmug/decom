// File: app/(root)/shipping-address/page.tsx
import { getMyCart } from '@/lib/actions/cart.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShippingAddress } from '@/types';
import { getUserById } from '@/lib/actions/user.actions';
import CheckoutSteps from '@/components/shared/checkout-steps';
import ShippingAddressClient from './shipping-address-client';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';

export const metadata: Metadata = {
  title: 'Shipping Address',
};

export default async function ShippingAddressPage() {
  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) {
    redirect('/cart');
  }

  
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('No user ID');
  }

  //well implement guest proceed to purchase soon.
  if (!session?.user?.id) {
    redirect('/sign-in') //user is not logged, lets redirect them.
  }

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={1} />
      <ShippingAddressClient defaultAddress={user.address as ShippingAddress} />
    </>
  );
}
