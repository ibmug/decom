'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShippingAddress } from '@/types';
import { ShippingMethod } from '@prisma/client';

const PlaceOrderForm = ({
  userAddress,
  shippingMethod,
}: {
  userAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/order/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: userAddress,
          shippingMethod,
        }),
      });

      const result = await res.json();

      if (result.success && result.orderId) {
        router.push(`/order/${result.orderId}`);
      } else {
        console.error('Order failed:', result.message);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Place Order
          </>
        )}
      </Button>
    </form>
  );
};

export default PlaceOrderForm;
