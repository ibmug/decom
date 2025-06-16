import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { formatError } from '@/lib/utils/utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.storeProduct.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    await prisma.storeProduct.delete({ where: { id } });
    await revalidatePath('/admin/products');
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: formatError(err) }, { status: 500 });
  }
}
