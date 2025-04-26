// File: app/(root)/shipping-address/shipping-address-fields.tsx
'use client';

import { UseFormRegister, FieldErrors, FieldError } from 'react-hook-form';
import { ShippingAddressInput } from '@/types';

const addressFields = [
  { label: 'Street', key: 'streetName' },
  { label: 'City', key: 'city' },
  { label: 'State', key: 'state' },
  { label: 'Postal Code', key: 'postalCode' },
] as const;

type AddrKey = typeof addressFields[number]['key'];

interface Props {
  register: UseFormRegister<ShippingAddressInput>;
  errors: FieldErrors<ShippingAddressInput>;
}

export default function ShippingAddressFields({ register, errors }: Props) {
  const addressErrors = errors.address as | Partial<Record<AddrKey, FieldError>> | undefined;
  return (
    <div className="grid grid-cols-1 gap-4">
      {addressFields.map(({ label, key }) => (
        <div key={key}>
          <label className="block text-sm font-medium">{label}</label>
          <input
            {...register(`address.${key}` as const, { required: true })}
            className="mt-1 block w-full rounded border px-2 py-1"
          />
          {addressErrors?.[key] && (
            <p className="text-xs text-red-600">{label} is required</p>
          )}
        </div>
      ))}

      {/* Optional phone */}
      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          {...register('address.phone')}
          className="mt-1 block w-full rounded border px-2 py-1"
        />
      </div>
    </div>
  );
}
