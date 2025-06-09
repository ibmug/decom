'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UIStoreProduct } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import ProductPrice from '@/components/shared/product/productPrice'
import { Session } from 'next-auth';
import AddToCartButton from '../add-to-cart-button'
import AddStock from '../add-stock-component'
import { useState } from 'react'

interface AccessoryDisplayProps {
  product: Extract<UIStoreProduct, { type: 'ACCESSORY' }>
  session: Session | null;
}

export default function AccessoryDisplay({ product, session }: AccessoryDisplayProps) {
  const [stock,setStock] = useState(product.stock)
  const { slug, price, accessory } = product
  if(session) console.log('User is logged.')

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <Link href={`/product/${slug}`} className="space-y-2 block">
          <Image
            src={accessory.images[0] || '/images/placeholder.png'}
            alt={accessory.name}
            width={400}
            height={400}
            className="rounded w-full object-cover aspect-square"
          />
          <div>
            <h3 className="text-md font-medium truncate">{accessory.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{accessory.category}</p>
            <p className="text-xs text-muted-foreground">{accessory.brand}</p>
          </div>
        </Link>
        <div className="mt-4 space-y-1">
          <p>{product.description}</p>
          <ProductPrice value={Number(price)} />
           <span className={`text-xs ${stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stock<5 ? <p><strong>Stock:</strong> {stock}</p> : <></>}
                      <AddToCartButton
              storeProductId={product.id}
              stock={stock}
              onStockChange={(change) => setStock(stock + change)}
            />
            
                      {session?.user?.role === 'admin' && (
                        
              <AddStock cardProductId={product.id} initialStock={product.stock} onStockChange={(change)=> setStock(stock+change)} />
            )}
            </span>
        </div>
        {/* <div className="flex justify-between items-center text-sm">
          
          <ProductPrice value={Number(price)} />
         
               
          
        </div> */}
      </CardContent>
    </Card>
  )
}
