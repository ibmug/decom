'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UIStoreProduct } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import ProductPrice from '@/components/shared/product/productPrice'
import { Session } from 'next-auth';

interface AccessoryDisplayProps {
  product: Extract<UIStoreProduct, { type: 'ACCESSORY' }>
  session: Session | null;
}

export default function AccessoryDisplay({ product, session }: AccessoryDisplayProps) {
  const { slug, price, stock, accessory } = product
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
        <div className="flex justify-between items-center text-sm">
          <ProductPrice value={Number(price)} />
          <span className={`text-xs ${stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
