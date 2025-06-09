'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface AddStockProps {
  cardProductId: string
  initialStock: number
  onStockChange?: (delta: number) => void
}

export default function AddStock({ cardProductId, initialStock, onStockChange }: AddStockProps) {
  const [stock, setStock] = useState(initialStock)
  const [input, setInput] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleStockChange = async (delta: number) => {
    if (delta === 0) return
    const newStock = stock + delta

    if (newStock < 0) {
      toast({
        title: 'Cannot subtract stock',
        description: 'Not enough stock to subtract that amount.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeProductId: cardProductId,
          newStock,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Stock update failed')
      }

      setStock(newStock)
      setInput(0)
      toast({
        title: 'Stock updated',
        description: `Stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}.`,
        variant: 'default',
      })

      if (onStockChange) onStockChange(delta)
    } catch (err) {
      toast({
        title: 'Error updating stock',
        description: String(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border p-4 rounded-lg w-full">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={input}
          onChange={(e) => setInput(Math.max(0, Number(e.target.value)))}
          className="w-16"
          disabled={loading}
        />

        <Button
          variant="destructive"
          onClick={() => handleStockChange(-(input || 1))}
          disabled={loading}
        >
          ➖
        </Button>
        <Button
          onClick={() => handleStockChange(input || 1)}
          disabled={loading}
        >
          ➕
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Current stock: {stock}</p>
    </div>
  )
}
