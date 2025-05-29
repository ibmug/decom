'use client'
import { useState, useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Plus, Minus, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatError } from '@/lib/utils/utils'
import { UICart } from '@/types'

type NewCartItem = { id: string; quantity: number; }

interface AddToCartProps {
  cart?: UICart
  item: NewCartItem
}

export default function AddToCart({ cart, item }: AddToCartProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [loadingAction, setLoadingAction] = useState<'add' | 'remove' | null>(null)

  const exists = cart?.items.find(x => x.productId === item.id)

  const handleQuantityChange = (itemId: string, delta: number) => {
    setLoadingAction(delta > 0 ? 'add' : 'remove')
    startTransition(async () => {
      try {
        const res = await fetch('/api/cart/update-quantity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity: delta }),
        })
        const result = await res.json()
        if (!result.success) {
          toast({ description: result.message, variant: 'destructive' })
        }
      } catch (err) {
        toast({ description: formatError(err), variant: 'destructive' })
      } finally {
        setLoadingAction(null)
      }
    })
  }

  if (exists) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => handleQuantityChange(item.id, -1)}
          disabled={isPending}
        >
          {loadingAction === 'remove' ? <Loader className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
        </Button>
        <span>{exists.qty}</span>
        <Button
          onClick={() => handleQuantityChange(item.id, 1)}
          disabled={isPending}
        >
          {loadingAction === 'add' ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => handleQuantityChange(item.id, 1)}
      disabled={isPending}
      className="w-full flex items-center justify-center"
    >
      {loadingAction === 'add' ? (
        <Loader className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Plus className="h-4 w-4 mr-1" />
      )}
      Add to Cart!
    </Button>
  )
}
