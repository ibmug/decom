import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type SortOption = {
  label: string;
  value: string;
};

interface SortControlProps {
  options: SortOption[];
  defaultField?: string;
  defaultOrder?: 'asc' | 'desc';
}

export default function SortControl({
  options,
  defaultField,
  defaultOrder = 'asc',
}: SortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialField = searchParams.get('sortBy') || defaultField || options[0].value;
  const initialOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultOrder;

  const [field, setField] = useState<string>(initialField);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Sync state when URL changes
  useEffect(() => {
    setField(searchParams.get('sortBy') || defaultField || options[0].value);
    setOrder((searchParams.get('sortOrder') as 'asc' | 'desc') || defaultOrder);
  }, [searchParams, defaultField, defaultOrder, options]);

  const applySort = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sortBy', field);
    params.set('sortOrder', order);
    params.delete('page'); // reset pagination on sort
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleOrder = () => setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));

  return (
    <div className="flex items-center space-x-2">
      <Select value={field} onValueChange={setField}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={toggleOrder}>
        {order === 'asc' ? '↑' : '↓'}
      </Button>

      <Button variant="default" size="sm" onClick={applySort}>
        Sort
      </Button>
    </div>
  );
}
