// import { NextResponse } from 'next/server';
// import { searchCards } from '@/lib/actions/card.actions';

// export async function GET(req: Request) {
//   const url = new URL(req.url);
//   const q    = url.searchParams.get('q')    ?? '';
//   const page = Number(url.searchParams.get('page') ?? '1');
//   const limit= Number(url.searchParams.get('limit')?? '12');

//   console.time("searchCards")
//   const result = await searchCards({ query: q, page, limit });
//   console.timeEnd("searchCards")
//   return NextResponse.json(result);
// }

import { NextResponse } from 'next/server';
import { searchCards } from '@/lib/actions/card.actions';

export const dynamic = 'force-dynamic'; 
export const runtime = 'nodejs';        

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q     = url.searchParams.get('q')    ?? '';
  const page  = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '12');

  console.time("searchCards");

  try {
    // 🕐 Soft timeout guard to prevent exceeding Vercel 10s limit
    const withTimeout = <T>(promise: Promise<T>, ms = 9000): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout (>9s)")), ms)
        ),
      ]);

    const result = await withTimeout(searchCards({ query: q, page, limit }));

    console.timeEnd("searchCards");

    return NextResponse.json(result);
  } catch (err: any) {
    console.timeEnd("searchCards");

    console.error("searchCards error:", err?.message ?? err);

    return NextResponse.json(
      { error: "Search failed or timed out." },
      { status: 500 }
    );
  }
}
