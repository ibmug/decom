'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UICatalogProduct } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import ProductPrice from '@/components/shared/product/productPrice'
import { Session } from 'next-auth';
import AddToCartButton from '../add-to-cart-button'
import AddStock from '../add-stock-component'
import { useState } from 'react'

interface AccessoryDisplayProps {
  product: Extract<UICatalogProduct, { type: "ACCESSORY" }>;
  session?: Session | null;
}
export default function AccessoryDisplay({ product, session }: AccessoryDisplayProps) {

const firstInventory = product.inventory[0];
const [stock, setStock] = useState(firstInventory?.stock ?? 0);

if (!firstInventory) {
  return <div>Inventory not found.</div>;
}

console.log(product)

  const { slug, accessory } = product

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <Link href={`/product/${slug}`} className="space-y-2 block">
          <Image
            src={product.images[0] || '/images/placeholder.png'}
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
          <p>{accessory.description}</p>
          <ProductPrice value={Number(product.price)} />
          <span className={`text-xs ${stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stock >= 1 ? <p><strong>Stock:</strong> {stock}</p> : <></>}
          </span>

          <AddToCartButton
            productId={product.id}
            inventoryId={firstInventory.id}
            stock={stock}           
            onStockChange={(change) => setStock(stock + change)}
          />

          {session?.user?.role === 'admin' && (
            <AddStock
              productId={product.id}
              inventoryId={firstInventory.id}
              initialStock={stock}
              onStockChange={(change) => setStock(stock + change)}
            />
          )}
        </div>

      </CardContent>
    </Card>
  )
}
