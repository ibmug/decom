// File: app/(root)/shipping-address/shipping-address-client.tsx
'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ShippingAddressInput, ShippingAddress } from '@/types';
import ShippingAddressForm from './shipping-address-form';

interface Props {
  defaultAddress?: ShippingAddress;
}

export default function ShippingAddressClient({ defaultAddress }: Props) {
  const methods = useForm<ShippingAddressInput>({
    defaultValues: {
      shippingMethod: defaultAddress?.shippingMethod ?? 'DELIVERY',
      address: defaultAddress?.address ?? {
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

  const onSubmit = (data: ShippingAddressInput) => {
    // persist data as needed...
    console.log({data})
    router.push('/payment-method');
  };

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
