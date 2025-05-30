import { prisma } from '@/db/prisma';
import { insertProductSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = insertProductSchema.parse(body);

    await prisma.product.create({ data });

    return NextResponse.json({ success: true, message: 'Product created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}
