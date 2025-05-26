
import { NextRequest } from 'next/server'
import { updateStock } from '@/lib/actions/store-product.actions'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  const { storeProductId, newStock } = await req.json()

  const result = await updateStock({ storeProductId, newStock })
    
  return Response.json({
    success:true,
    redirect:'/searchCard'
  })
}
