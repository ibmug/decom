import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import { updateProductSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = updateProductSchema.parse(body);

    await prisma.product.update({
      where: { id: data.id },
      data,
    });

    return NextResponse.json({ success: true, message: 'Product updated' });
  } catch (error) {
    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 });
  }
}
