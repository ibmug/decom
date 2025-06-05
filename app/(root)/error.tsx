'use client';

import { useToast } from '@/hooks/use-toast';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error;
}) {
  useEffect(() => {
    console.error('Global rendering error:', error);
  }, [error]);


  const {toast} = useToast();
  const customSubmit=() =>{
    toast({
              description: 'Reloading page...',
              variant:'destructive'
            })
    redirect('/')
    return;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-bold mb-4">🔧 Under Maintenance</h1>
      <p className="text-lg text-gray-600 mb-4">
        We are doing some updates. Please try again shortly.
      </p>
      <button
        onClick={customSubmit}
        className="mt-4 px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </main>
  );
}
