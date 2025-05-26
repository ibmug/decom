
import { NextRequest } from 'next/server'
import { updateStock } from '@/lib/actions/store-product.actions'


export async function POST(req: NextRequest) {
  const { storeProductId, newStock } = await req.json()

  const result = await updateStock({ storeProductId, newStock })
  if (!result) {throw new Error ('Could not update stock')}
    
  return Response.json({
    success:true,
    redirect:'/searchCard'
  })
}
