// File: app/(root)/shipping-address/shipping-address-client.tsx
'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ShippingAddressInput, ShippingAddress } from '@/types';
import ShippingAddressForm from './shipping-address-form';
import { updateUserAddress } from '@/lib/actions/user.actions';
//import {useCheckout} from '@/context/CheckoutContext';

interface Props {
  defaultAddress?: ShippingAddress;
}

export default function ShippingAddressClient({ defaultAddress }: Props) {
  const methods = useForm<ShippingAddressInput>({
    defaultValues: {
      shippingMethod: defaultAddress?.shippingMethod ?? 'DELIVERY',
      address: defaultAddress?.address ?? {
        fullName: '',
        country: '',
        streetName: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
      },
      storeId: defaultAddress?.storeId ?? '',
    },
  });
  const router = useRouter();


    const onSubmit = async (data: ShippingAddressInput) => {  
      
      
          // build the body you’ll send…
          let payload = { ...data }
      
          if (data.shippingMethod === 'PICKUP' && data.storeId) {
            // fetch all stores once
            const storeRes = await fetch('/api/stores')
            const stores: { id: string; name: string; address: string }[] = await storeRes.json()
            const store = stores.find((s) => s.id === data.storeId)
      
            payload = {
              ...data,
              storeName:    store?.name    ?? '',
             storeAddress: store?.address ?? '',
            }
          }
      
          // now send exactly one POST
          const res = await fetch('/api/user/shipping', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          })
           if (!res.ok) {
             console.error('Save failed', await res.json())
             const { error } = await res.json()
             alert(error)
             return
           }
           updateUserAddress(data)
           router.push('/payment-method')
         }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <ShippingAddressForm />
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
