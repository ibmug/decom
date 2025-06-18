'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PriceEditorProps {
  inventoryId: string;
  currentPrice: number | string;
}

export default function PriceEditor({ inventoryId, currentPrice }: PriceEditorProps) {
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId,
          price: parseFloat(price),
        }),
      });

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
