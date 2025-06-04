'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
      const params = new URLSearchParams(searchParams.toString())
   if (query.trim()) {
      params.set('q', query.trim()) 
    } else {
      params.delete('q') // Remove if empty
    }

   // const encodedQuery = encodeURIComponent(params.toString());
    router.push(`/search?${params.toString()}`);
  };


// const handleSearch = () => {
//   const params = new URLSearchParams(searchParams.toString())
//   if (query) params.set('q', query)
//   else params.delete('q')

//   router.push(`/search?${params.toString()}`)
// }


  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full px-4 py-2 border rounded"
      />
    </form>
  );
}
