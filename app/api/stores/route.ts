
import { STORES } from '@/lib/constants';
import { NextResponse } from 'next/server';

const demoStores = STORES


export async function GET() {
  return NextResponse.json(demoStores);
}