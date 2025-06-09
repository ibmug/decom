'use client';

import { useState } from 'react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';
import { formatError } from '@/lib/utils/utils';

export default function AddToCartButton({
  storeProductId,
  stock,
  onStockChange,
}: {
  storeProductId: string;
  stock: number;
  onStockChange?: (newStock: number) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const res = await addItemToCart({ storeProductId });
      if (!res.success) {
        toast({ description: res.message, variant: 'destructive' });
        return;
      }

      toast({ description: res.message, variant: 'default' });

      if (typeof onStockChange === 'function') {
        onStockChange(-1); // reduce stock by 1
      }
    } catch (err) {
      console.error('Add to cart failed', err);
      toast({ description: formatError(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (stock <= 0) {
    return <p className="text-red-500 font-medium">No stock available for now!</p>;
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className="bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/80 transition disabled:opacity-50"
    >
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
