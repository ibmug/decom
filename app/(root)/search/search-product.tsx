'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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

  // Helper to build query string
  function buildQueryParams(page: number): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (set) params.set('set', set);
    if (cardType) params.set('cardType', cardType);
    if (colors) params.set('colors', colors);
    if (colorsExact) params.set('colorsExact', colorsExact);
    if (manaCost) params.set('manaCost', manaCost);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('page', page.toString());
    return params.toString();
  }

  // Initial load: reset results when filters change
  useEffect(() => {
    async function fetchFirstPage() {
      setResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setLoading(true);

      try {
        const res = await fetch(`/api/products?${buildQueryParams(1)}`);
        const json: SearchResult = await res.json();
        setResults(json.data);
        setTotalPages(json.totalPages);
      } catch (error) {
        console.error("Failed to fetch page:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFirstPage();
  }, [q, type, set, cardType, colors, colorsExact, manaCost, minPrice, maxPrice]);

  // Load next pages via infinite scroll
  async function loadNextPage() {
    if (loading || currentPage >= totalPages) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products?${buildQueryParams(currentPage + 1)}`);
      const json: SearchResult = await res.json();

      setResults(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newData = json.data.filter(product => !existingIds.has(product.id));
        return [...prev, ...newData];
      });

      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error("Failed to fetch next page:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [currentPage, totalPages, loading]);  // observer only depends on state

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
