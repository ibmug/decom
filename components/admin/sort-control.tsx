// components/shared/SortSelector.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ArrowUp, ArrowDown } from "lucide-react"
import type { SortOption } from "./sortselector.types"

interface SortSelectorProps {
  options: SortOption[]
}

export default function SortSelector({ options }: SortSelectorProps) {
  const router = useRouter()
  const params = useSearchParams()

  const currentField = params.get("orderby") ?? options[0].value
  const currentOrder = params.get("order") === "desc" ? "desc" : "asc"

  function setParams(field: string, order: "asc" | "desc") {
    const next = new URLSearchParams(params.toString())
    next.set("orderby", field)
    next.set("order", order)
    next.set("page", "1")
    router.push(`?${next.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Select
        value={currentField}
        onValueChange={(v) => setParams(v, currentOrder)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setParams(currentField, currentOrder === "asc" ? "desc" : "asc")}
        aria-label="Toggle sort order"
      >
        {currentOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
