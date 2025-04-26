'use client';

import { useEffect, useState } from 'react';

export interface Store {
  id: string;
  name: string;
  address: string;
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
      .then(setStores)
      .catch(() => setStores([]));
  }, []);

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
          <option key={s.id} value={s.id}>
            {s.name} — {s.address}
          </option>
        ))}
      </select>
    </div>
  );
}
