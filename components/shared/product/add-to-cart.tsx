'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatError } from '@/lib/utils/utils';
import { UICart } from '@/types';
import { useRouter } from 'next/navigation';

type NewCartItem = {
  productId: string;
  inventoryId: string;
  qty: number;
};


interface AddToCartProps {
  cart?: UICart;
  item: NewCartItem;
  stock: number;
}

export default function AddToCart({ cart, item, stock }: AddToCartProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<'add' | 'remove' | null>(null);
  const router = useRouter();

  const currentItem = cart?.items.find(
    (x) => x.productId === item.productId && x.inventoryId === item.inventoryId
  );

  const handleQuantityChange = (delta: number) => {
    setLoadingAction(delta > 0 ? 'add' : 'remove');

    startTransition(async () => {
      try {
        const currentQty = currentItem?.qty ?? 0;
        const newQty = currentQty + delta;

        if (newQty < 0 || newQty > stock) {
          toast({
            description: `Invalid quantity`,
            variant: 'destructive',
          });
          return;
        }

        const res = await fetch('/api/cart/update-quantity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
  productId: item.productId, 
  inventoryId: item.inventoryId, 
  qty: newQty 
})

        });

        const result = await res.json();
        if (!result.success) {
          toast({ description: result.message, variant: 'destructive' });
        }

        router.refresh();
      } catch (err) {
        toast({ description: formatError(err), variant: 'destructive' });
      } finally {
        setLoadingAction(null);
      }
    });
  };

  if (currentItem) {
    return (
      <div className="flex items-center space-x-2">
        <Button onClick={() => handleQuantityChange(-1)} disabled={isPending || currentItem.qty <= 0}>
          {loadingAction === 'remove' ? <Loader className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
        </Button>
        <span>{currentItem.qty}</span>
        <Button onClick={() => handleQuantityChange(1)} disabled={isPending || currentItem.qty >= stock}>
          {loadingAction === 'add' ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => handleQuantityChange(1)}
      disabled={isPending}
      className="w-full flex items-center justify-center"
    >
      {loadingAction === 'add' ? (
        <Loader className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Plus className="h-4 w-4 mr-1" />
      )}
      Add to Cart
    </Button>
  );
}
