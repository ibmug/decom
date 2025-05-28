'use client'
//import { useState, useTransition } from 'react'
//import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Plus, Minus, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Cart, CartItem } from '@/types'
import { formatError } from '@/lib/utils/utils'

interface AddToCartProps {
  cart?: Cart
  item: CartItem
}

export default function AddToCart({ cart, item }: AddToCartProps) {
  //const router = useRouter()
  const { toast } = useToast()
  //const [isPending, startTransition] = useTransition()
  //const [loading, setLoading] = useState<'add' | 'remove' | null>(null)

  const exists = cart?.items.find((x) => x.productId === item.id)

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch("/api/cart/update-quantity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity }),
      })

      const result = await response.json()

      if (!result.success) {
        toast({ description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ description: formatError(error), variant: "destructive" })
    }
  }


  if (exists) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          onClick={() => handleQuantityChange(item.id, -1)}
          disabled={loading === 'remove' || isPending}
        >
          {(loading === 'remove' || (isPending && !loading)) ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </Button>
        <span>{exists.qty}</span>
        <Button
          type="button"
          onClick={() => handleQuantityChange(item.id, 1)}
          disabled={loading === 'add' || isPending}
        >
          {(loading === 'add' || (isPending && !loading)) ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      className="w-full flex items-center justify-center"
      type="button"
      onClick={()=>handleQuantityChange(item.id, 1)}
      disabled={loading === 'add' || isPending}
    >
      {loading === 'add' ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-1" />
      )}
      Add to Cart!
    </Button>
  )
}
