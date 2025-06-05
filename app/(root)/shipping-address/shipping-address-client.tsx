// File: app/(root)/shipping-address/shipping-address-client.tsx
'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ShippingAddressInput, ShippingAddress } from '@/types';
import ShippingAddressForm from './shipping-address-form';
import { updateUserAddress } from '@/lib/actions/user.actions';
import { useState } from 'react';
//import {useCheckout} from '@/context/CheckoutContext';

interface Props {
  defaultAddress?: ShippingAddress;
}

export default function ShippingAddressClient({ defaultAddress }: Props) {
  const methods = useForm<ShippingAddressInput>({
    defaultValues: {
  shippingMethod: defaultAddress?.shippingMethod ?? 'DELIVERY',
  address: {
    fullName:   defaultAddress?.address?.fullName   ?? '',
    country:    defaultAddress?.address?.country    ?? '',
    streetName: defaultAddress?.address?.streetName ?? '',
    city:       defaultAddress?.address?.city       ?? '',
    state:      defaultAddress?.address?.state      ?? '',
    postalCode: defaultAddress?.address?.postalCode ?? '',
    phone:      defaultAddress?.address?.phone      ?? '',
    notes:      defaultAddress?.address?.notes      ?? '',
  },
  addressName: defaultAddress?.addressName ?? '',
},
  });
  const router = useRouter();
  const [storeId, setStoreId] = useState('');


  const onSubmit = async (data: ShippingAddressInput) => {
  let payload: ShippingAddressInput = { ...data };

  if (data.shippingMethod === 'PICKUP' && storeId) {
  const storeRes = await fetch('/api/stores');
  const { stores } = await storeRes.json();
  const store = stores.find((s: { storeId: string }) => s.storeId === storeId);
  if (!store) throw new Error("Selected store not found.");

  payload = {
    shippingMethod: 'PICKUP',
    addressName: store.addressName,
    address: store.address, 
  };
}



  

  const res = await fetch('/api/user/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const { error } = await res.json();
    console.error('Save failed', error);
    alert(error);
    return;
  }

  router.push('/payment-method');
};

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <ShippingAddressForm storeId={storeId} setStoreId={setStoreId}/>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
    </FormProvider>
  );
}
