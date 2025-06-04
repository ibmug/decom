'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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

  const q           = sp.get('q') ?? ''
  const page        = sp.get('page') ?? '1'
  const type        = sp.get('type')
  const set         = sp.get('set')
  const cardType    = sp.get('cardType')
  const colors      = sp.get('colors')
  const colorsExact = sp.get('colorsExact')
  const manaCost    = sp.get('manaCost')
  const minPrice    = sp.get('minPrice')
  const maxPrice    = sp.get('maxPrice')

  const searchParamString = sp.toString()

  const [results, setResults] = useState<SearchResult>({ data: [], totalPages: 1, currentPage: Number(page) })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams()
    if (q)           params.set('q', q)
    if (page)        params.set('page', page)
    if (type)        params.set('type', type)
    if (set)         params.set('set', set)
    if (cardType)    params.set('cardType', cardType)
    if (colors)      params.set('colors', colors)
    if (colorsExact) params.set('colorsExact', colorsExact)
    if (manaCost)    params.set('manaCost', manaCost)
    if (minPrice)    params.set('minPrice', minPrice)
    if (maxPrice)    params.set('maxPrice', maxPrice)

    const url = `/api/products?${params.toString()}`
    

    fetch(url)
      .then(res => res.json())
      .then((json: SearchResult) => setResults(json))
      .finally(() => setLoading(false))
  }, [searchParamString])

  if (loading) return <p>Loading products…</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.data.length === 0 ? (
          <p>No products found for “{q}”.</p>
        ) : (
          results.data.map((product) => {
            if (product.type === 'CARD' && product.cardMetadata) {
              return (
                <CardDisplay
                  key={product.id}
                  product={toCardItem(product)}
                  session={session}
                />
              )
            }

            if (product.type === 'ACCESSORY' && product.accessory) {
              return (
                <AccessoryDisplay
                  key={product.id}
                  product={product}
                  session={session}
                />
              )
            }

            return null
          })
        )}
      </div>
      <Pagination totalPages={results.totalPages} />
    </div>
  )
}
