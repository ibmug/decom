import { NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { revalidatePath } from 'next/cache'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const product = await prisma.product.findFirst({ where: { id } })
    if (!product) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })

    await prisma.product.delete({ where: { id } })
    await revalidatePath('/admin/products')

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error deleting product' }, { status: 500 })
  }
}
