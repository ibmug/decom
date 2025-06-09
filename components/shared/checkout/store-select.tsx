'use client';

import { useEffect, useState } from 'react';

export interface Store {
  storeId: string;
  addressName: string;
  address: {
    fullName: string;
    streetName: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string;
  };
}


interface Props {
  value?: string;
  onChange: (id: string) => void;
}

export default function StoreSelect({ value, onChange }: Props) {
  const [stores, setStores] = useState<Store[]>([]);

useEffect(() => {
  fetch('/api/stores')
    .then((res) => res.json())
    .then((data) => {
      setStores(data.stores ?? []); // ← Fix: extract the array from the object
    })
    .catch(() => setStores([]));
}, []);

  console.log(stores)

  return (
    <div>
      <label htmlFor="store" className="block text-sm font-medium">
        Pickup location
      </label>
      <select
        id="store"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded border px-2 py-1"
      >
        <option value="">Select a store…</option>
        {stores.map((s) => (
          <option key={s.storeId} value={s.storeId}>
    {s.addressName} — {s.address.streetName}
  </option>
        ))}
      </select>
    </div>
  );
}
