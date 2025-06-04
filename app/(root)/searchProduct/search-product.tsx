'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { UIStoreProduct } from '@/types'
import { Session } from 'next-auth'

import CardDisplay from '@/components/shared/CardDisplay/card-display'
import AccessoryDisplay from '@/components/shared/AccessoryDisplay/accessory-display'
import Pagination from '@/components/Pagination/pagination'
import { toCardItem } from '@/lib/utils/transformers'


interface SearchResult {
  data: UIStoreProduct[]
  totalPages: number
  currentPage: number
}

interface SearchProductClientProps {
  session: Session | null
}

export default function SearchProductClient({ session }: SearchProductClientProps) {
  const sp = useSearchParams()
  const q = sp.get('q') ?? ''
  const page = Number(sp.get('page') ?? '1')

  const [results, setResults] = useState<SearchResult>({ data: [], totalPages: 1, currentPage: page })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?q=${encodeURIComponent(q)}&page=${page}`)
      .then(res => res.json())
      .then((json: SearchResult) => setResults(json))
      .finally(() => setLoading(false))
  }, [q, page])

  if (loading) return <p>Loading products…</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.data.length === 0 ? (
          <p>No products found for “{q}”.</p>
        ) : (
          results.data.map((product) => {
  if (product.type === 'CARD' && product.card) {
    
    return (
      <CardDisplay
        key={product.id}
        product={toCardItem(product)}
        session={session}
      />
    );
  }

  if (product.type === 'ACCESSORY' && product.accessory) {
    return (
      <AccessoryDisplay
        key={product.id}
        product={product}
        session={session}
      />
    );
  }

  return null;
})
        )}
      </div>
      <Pagination totalPages={results.totalPages} />
    </div>
  )
}
