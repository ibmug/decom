
import { STORES } from '@/lib/constants';
import { NextResponse } from 'next/server';

const demoStores = Object.values(STORES)


export async function GET() {
  return NextResponse.json({stores:demoStores});
}