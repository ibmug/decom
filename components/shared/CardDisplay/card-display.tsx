'use client'

import Image from 'next/image';
import { useState, type FC } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { CardItem } from '@/types'
import AddStock from '../add-stock-component';
import { Session } from 'next-auth';
import AddToCartButton from '../add-to-cart-button';


interface CardDisplayProps {
  product: CardItem;
  session: Session | null;
}

const CardDisplay: FC<CardDisplayProps> = ({ product, session }) => {


  const [stock,setStock] = useState(product.stock)

  console.log(session?.user.role)
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className='p-0 items-center'>
            <Link href={`/card/${product.slug}`}>

            <Image src={product.imageUrl} alt={product.name||"Image loading..."} height={300} width={300} priority={false} loading='lazy'/>
            </Link>
        </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 truncate">Set: {product.setCode.toUpperCase()} #{product.collectorNum}</p>
        <p className="mt-2 text-sm text-gray-700">{product.oracleText || 'No description available.'}</p>
        <div className="mt-4 space-y-1">
          <p><strong>Colors:</strong> {product.colorIdentity.length ? product.colorIdentity.join(', ') : 'Colorless'}</p>
          <p><strong>Price:</strong> ${product.usdPrice?.toString() || 'n/a'}</p>
          <span className={`text-xs ${stock > 1 ? 'text-green-500' : 'text-red-500'}`}>
            {stock>=1 ? <p><strong>Stock:</strong> {stock}</p> : <></>}</span>
          <AddToCartButton
  storeProductId={product.storeProductId}
  stock={stock}
  onStockChange={(change) => setStock(stock + change)}
/>

          {session?.user?.role === 'admin' && (
            
  <AddStock cardProductId={product.storeProductId} initialStock={product.stock} onStockChange={(change)=> setStock(stock+change)} />
)}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardDisplay;
