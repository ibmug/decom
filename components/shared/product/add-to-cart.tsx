'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { useToast }                from '@/hooks/use-toast'
import { ToastAction }             from '@/components/ui/toast'
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions'
import { Plus, Minus, Loader }     from 'lucide-react'
import { Button }                  from '@/components/ui/button'
import type { Cart, CartItem }     from '@/types'

interface AddToCartProps {
  cart?: Cart
  item: CartItem
}

export default function AddToCart({ cart, item }: AddToCartProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState<'add' | 'remove' | null>(null)

  const exists = cart?.items.find((x) => x.productId === item.productId)

//   const handleAdd = () => {
//     setLoading('add')
//     // 1) call server action exactly once
//     const promise = addItemToCart(item)
//     promise
//       .then((res) => {
//         // 2) schedule UI updates in a transition
//         startTransition(() => {
//           if (!res.success) {
//             toast({ variant: 'destructive', description: res.message })
//             return
//           }
//           toast({
//             description: res.message,
//             action: (
//               <ToastAction
//                 altText="Go To Cart"
//                 onClick={() => router.push('/cart')}
//               >
//                 Go to Cart!
//               </ToastAction>
//             ),
//           })
//         })
//       })
//       .finally(() => {
//         setLoading(null)
//       })
//   }
const handleAdd = () => {
    
    setLoading('add');
  
    // Only this sync callback goes into React's transition
    startTransition(() => {
      // Fire the server action exactly once
      
      addItemToCart(item)
        .then((res) => {
          // schedule UI updates in a low-priority transition
          
          startTransition(() => {
            if (!res.success) {
              toast({ variant: 'destructive', description: res.message });
            } else {
              toast({
                description: res.message,
                action: (
                  <ToastAction
                    altText="Go to Cart"
                    onClick={() => router.push('/cart')}
                  >
                    Go to Cart!
                  </ToastAction>
                ),
              });
            }
          });
        })
        .finally(() => {
          // clear our loading flag once the action completes
          setLoading(null);
        });
    });
  };

  const handleRemove = () => {
    setLoading('remove')
    const promise = removeItemFromCart(item.productId)
    promise
      .then((res) => {
        startTransition(() => {
          toast({
            variant: res.success ? 'default' : 'destructive',
            description: res.message,
          })
        })
      })
      .finally(() => {
        setLoading(null)
      })
  }

  if (exists) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          onClick={handleRemove}
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
          onClick={handleAdd}
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
      onClick={handleAdd}
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
