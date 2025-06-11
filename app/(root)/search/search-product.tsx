'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { UIStoreProduct } from '@/types'
import { Session } from 'next-auth'

import CardDisplay from '@/components/shared/CardDisplay/card-display'
import AccessoryDisplay from '@/components/shared/AccessoryDisplay/accessory-display'
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
  const type        = sp.get('type')
  const set         = sp.get('set')
  const cardType    = sp.get('cardType')
  const colors      = sp.get('colors')
  const colorsExact = sp.get('colorsExact')
  const manaCost    = sp.get('manaCost')


  const [results, setResults] = useState<UIStoreProduct[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const observerRef = useRef<HTMLDivElement | null>(null)

  // Build query params string helper
  const buildQueryParams = (page: number) => {
    const params = new URLSearchParams()
    if (q)           params.set('q', q)
    if (page)        params.set('page', page.toString())
    if (type)        params.set('type', type)
    if (set)         params.set('set', set)
    if (cardType)    params.set('cardType', cardType)
    if (colors)      params.set('colors', colors)
    if (colorsExact) params.set('colorsExact', colorsExact)
    if (manaCost)    params.set('manaCost', manaCost)

    return params.toString()
  }

  // Load initial + next pages
  const fetchPage = useCallback(async (page: number) => {
    if (loading || page > totalPages) return

    setLoading(true)
    const url = `/api/products?${buildQueryParams(page)}`

    const res = await fetch(url)
    const json: SearchResult = await res.json()

    setResults(prev => {
  const existingIds = new Set(prev.map(p => p.id));
  const newData = json.data.filter(product => !existingIds.has(product.id));
  return [...prev, ...newData];
});
    setTotalPages(json.totalPages)
    setCurrentPage(page)
    setLoading(false)
  }, [q, type, set, cardType, colors, colorsExact, manaCost, loading, totalPages])

  // Reset state if search params change (except page)
  useEffect(() => {
    setResults([])
    setCurrentPage(1)
    setTotalPages(1)
    fetchPage(1)
  }, [q, type, set, cardType, colors, colorsExact, manaCost])

  // Setup infinite scroll observer
  useEffect(() => {
    if (!observerRef.current) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        fetchPage(currentPage + 1)
      }
    }, { threshold: 1.0 })

    observer.observe(observerRef.current)

    return () => observer.disconnect()
  }, [currentPage, totalPages, fetchPage])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.length === 0 && !loading ? (
          <p>No products found for “{q}”.</p>
        ) : (
          results.map((product) => {
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

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-10" />

      {loading && <p>Loading more products…</p>}
    </div>
  )
}
