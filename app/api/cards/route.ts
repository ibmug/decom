import { NextResponse } from 'next/server';
import { searchCards } from '@/lib/actions/card.actions';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q    = url.searchParams.get('q')    ?? '';
  const page = Number(url.searchParams.get('page') ?? '1');
  const limit= Number(url.searchParams.get('limit')?? '12');

  console.time("searchCards")
  const result = await searchCards({ query: q, page, limit });
  console.timeEnd("searchCards")
  return NextResponse.json(result);
}