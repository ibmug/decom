'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


interface AddStockProps {
  cardProductId: string
  initialStock: number
}

export default function AddStock({ cardProductId, initialStock }: AddStockProps) {
  const [stock, setStock] = useState(initialStock)
  const [input, setInput] = useState(0)
  const [loading, setLoading] = useState(false)

  const updateStockHandler = async (delta: number) => {
    
    if (!delta || delta === 0) return
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stock/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeProductId: cardProductId,
          newStock: stock + delta,
        }),
      })

      if (!res.ok) throw new Error("Failed request")
      const result = await res.json()
      if (result.success) {
        setStock(stock + delta)
        setInput(0)
      } else {
        console.error("Update failed:", result.message)
      }
    } catch (err) {
      console.error("Failed to update stock:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border p-4 rounded-lg w-full">
      <div className="flex items-center">
        <Input
          type="number"
          value={input}
          onChange={(e) => setInput(Number(e.target.value))}
          className="w-14"
        />
        <Button
          variant="destructive"
          onClick={() => updateStockHandler(-input)}
          disabled={loading || input <= 0 || input > stock}
        >
          {loading ? "Removing..." : "Remove"}
        </Button>
        <Button
          onClick={() => updateStockHandler(input)}
          disabled={loading || input <= 0}
        >
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>
    </div>
  )
}
