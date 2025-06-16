'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import CardDisplay from '@/components/shared/CardDisplay/card-display';
import Pagination from './pagination';
import type { UIStoreProduct } from '@/types';
import { Session } from 'next-auth';
import { toUICatalogProduct } from '@/lib/utils/transformers';

interface SearchResult {
  data: UIStoreProduct[];
  totalPages: number;
  currentPage: number;
}

interface SearchCardClientProps {
  session?: Session | null;
}

export default function SearchCardClient({ session }: SearchCardClientProps) {
  const sp = useSearchParams();
  const q = sp.get('q') ?? '';
  const page = Number(sp.get('page') ?? '1');

  const [results, setResults] = useState<SearchResult>({ data: [], totalPages: 1, currentPage: page });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cards?q=${encodeURIComponent(q)}&page=${page}`)
      .then(res => res.json())
      .then((json: SearchResult) => setResults(json))
      .finally(() => setLoading(false));
  }, [q, page]);

  if (loading) return <p>Loading cards…</p>;

  const safeSession = session ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.data.length === 0 ? (
          <p>No cards found for “{q}”.</p>
        ) : (
          results.data.map((product) => {
            const catalogProduct = toUICatalogProduct(product);

            if (catalogProduct.type === 'CARD') {
              return (
                <CardDisplay
                  key={catalogProduct.id}
                  product={catalogProduct}
                  session={safeSession}
                />
              );
            }

            // We skip any non-card product just in case, but this page is card-only
            return null;
          })
        )}
      </div>
      <Pagination totalPages={results.totalPages} />
    </div>
  );
}
