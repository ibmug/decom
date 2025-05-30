// File: app/(root)/shipping-address/shipping-address-form.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { ShippingAddressInput } from '@/types';
import ShippingAddressFields from './shipping-address-fields';
import StoreSelect from '@/components/shared/checkout/store-select';



interface Props {
  storeId: string;
  setStoreId: (id: string) => void;
}

export default function ShippingAddressForm({ storeId, setStoreId }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ShippingAddressInput>();

  

  const method = watch('shippingMethod');

  return (
    <div className="space-y-6">
      {/* Shipping method radios */}
      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="DELIVERY"
            {...register('shippingMethod')}
            defaultChecked
            className="form-radio"
          />
          <span>Ship to address</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="PICKUP"
            {...register('shippingMethod')}
            className="form-radio"
          />
          <span>Pick up in store</span>
        </label>
      </div>

      {/* Conditional sections */}
      {method === 'DELIVERY' && (
        <ShippingAddressFields register={register} errors={errors} />
      )}
      {method === 'PICKUP' && (
       <StoreSelect
          value={storeId}
          onChange={(id: string) => setStoreId(id)}
        />
      )}
    </div>
  );
}
