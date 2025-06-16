'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { UICatalogProduct, UIStoreProduct } from '@/types';
import { Session } from 'next-auth';
import CardDisplay from '@/components/shared/CardDisplay/card-display';
import AccessoryDisplay from '@/components/shared/AccessoryDisplay/accessory-display';
import { toUICatalogProduct } from '@/lib/utils/transformers';

interface SearchResult {
  data: UIStoreProduct[];
  totalPages: number;
  currentPage: number;
}

interface SearchProductClientProps {
  session?: Session | null;
}

export default function SearchProductClient({ session }: SearchProductClientProps) {
  const sp = useSearchParams();

  const q = sp.get('q') ?? '';
  const type = sp.get('type');
  const set = sp.get('set');
  const cardType = sp.get('cardType');
  const colors = sp.get('colors');
  const colorsExact = sp.get('colorsExact');
  const manaCost = sp.get('manaCost');
  const minPrice = sp.get('minPrice');
  const maxPrice = sp.get('maxPrice');

  const [results, setResults] = useState<UIStoreProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const buildQueryParams = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page) params.set('page', page.toString());
    if (type) params.set('type', type);
    if (set) params.set('set', set);
    if (cardType) params.set('cardType', cardType);
    if (colors) params.set('colors', colors);
    if (colorsExact) params.set('colorsExact', colorsExact);
    if (manaCost) params.set('manaCost', manaCost);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    return params.toString();
  }, [q, type, set, cardType, colors, colorsExact, manaCost, minPrice, maxPrice]);

  const fetchPage = useCallback(async (page: number) => {
    if (loading || page > totalPages) return;

    setLoading(true);
    const url = `/api/products?${buildQueryParams(page)}`;

    try {
      const res = await fetch(url);
      const json: SearchResult = await res.json();

      setResults(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newData = json.data.filter(product => !existingIds.has(product.id));
        return [...prev, ...newData];
      });

      setTotalPages(json.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch page:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, totalPages, buildQueryParams]);

  useEffect(() => {
    setResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        fetchPage(currentPage + 1);
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [currentPage, totalPages, fetchPage]);

  const safeSession = session ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.length === 0 && !loading ? (
          <p>No products found for “{q}”.</p>
        ) : (
          results.map((product) => {
            const catalogProduct: UICatalogProduct = toUICatalogProduct(product);

            if (catalogProduct.type === 'CARD') {
              return (
                <CardDisplay
                  key={catalogProduct.id}
                  product={catalogProduct}
                  session={safeSession}
                />
              );
            }

            if (catalogProduct.type === 'ACCESSORY') {
              return (
                <AccessoryDisplay
                  key={catalogProduct.id}
                  product={catalogProduct}
                  session={safeSession}
                />
              );
            }

            return null;
          })
        )}
      </div>

      <div ref={observerRef} className="h-10" />
      {loading && <p>Loading more products…</p>}
    </div>
  );
}
