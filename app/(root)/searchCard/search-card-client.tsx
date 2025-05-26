'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import CardDisplay from '@/components/shared/CardDisplay/card-display';
import Pagination from './pagination';
import type {CardItem} from '@/types'
import { Session } from 'next-auth';


interface SearchResult {
  data: CardItem[];
  totalPages: number;
  currentPage: number;
}

interface SearchCardClientProps{
  session: Session | null
}

export default function SearchCardClient({session}:SearchCardClientProps) {
  const sp   = useSearchParams();
  const q    = sp.get('q')    ?? '';
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.data.length === 0 ? (
          <p>No cards found for “{q}”.</p>
        ) : (
          results.data.map((card: CardItem) => (
            <CardDisplay key={card.id} product={card} session={session}/>
          ))
        )}
      </div>
      <Pagination
        totalPages={results.totalPages}
      />
    </div>
  );
}