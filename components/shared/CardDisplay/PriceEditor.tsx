'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PriceEditorProps {
  productId: string;
  currentPrice: number | string;
}

export default function PriceEditor({ productId, currentPrice }: PriceEditorProps) {
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const theUrl = new URL('/api/admin/update-price',window.location.origin).toString()
      const res = await fetch(theUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          price: parseFloat(price),
        }),
      });

      console.warn("FRONTPOSTING:",productId, price)

      if (!res.ok) throw new Error('Failed to update price');
      toast({ description: "Price updated successfully" });
    } catch (err) {
      console.error(err);
      toast({ description: 'Error updating price', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-24"
      />
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
