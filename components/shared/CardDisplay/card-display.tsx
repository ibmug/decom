'use client'

import Image from 'next/image';
import { useState, type FC } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { UICatalogProduct, UIInventory } from '@/types';
import AddStock from '../add-stock-component';
import { Session } from 'next-auth';
import AddToCartButton from '../add-to-cart-button';

// Priority order for condition sorting
const CONDITION_PRIORITY = ['NM', 'LP', 'MP', 'HP', 'DMG'];

function selectBestInventory(inventories: UIInventory[]): UIInventory | undefined {
  return [...inventories].sort((a, b) => {
    const condA = CONDITION_PRIORITY.indexOf(a.condition ?? 'NM');
    const condB = CONDITION_PRIORITY.indexOf(b.condition ?? 'NM');

    const langA = a.language ?? '';
    const langB = b.language ?? '';

    if (condA !== condB) return condA - condB;
    return langA.localeCompare(langB);
  })[0]; // Return the top inventory
}


interface CardDisplayProps {
  product: Extract<UICatalogProduct, { type: "CARD" }>;
  session?: Session | null;
}

const CardDisplay: FC<CardDisplayProps> = ({ product, session }) => {
  const bestInventory = selectBestInventory(product.inventory);
  const [stock, setStock] = useState(bestInventory?.stock ?? 0);

  if (!bestInventory) {
    return <div>No available inventory.</div>;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className='p-0 items-center'>
        <Link href={`/card/${product.slug}`}>
          <Image 
            src={product.images?.[0] ?? '/images/cardPlaceholder.png'}
            alt={product.name || "Image loading..."}
            height={300}
            width={300}
            priority={false}
            loading='lazy'
          />
        </Link>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-600 truncate">
          Set: {product.setCode.toUpperCase()} #{product.collectorNum}
        </p>

        <p className="mt-2 text-sm text-gray-700">
          {product.oracleText || 'No description available.'}
        </p>

        <div className="mt-4 space-y-1">
          <p><strong>Colors:</strong> {product.colorIdentity.length ? product.colorIdentity.join(', ') : 'Colorless'}</p>
          <p><strong>Price:</strong> ${product.price.toString()}</p>
          <span className={`text-xs ${stock > 1 ? 'text-green-500' : 'text-red-500'}`}>
            {stock >= 1 ? <p><strong>Stock:</strong> {stock}</p> : null}
          </span>

          <AddToCartButton
            productId={product.id}
            inventoryId={bestInventory.id}
            stock={stock}
            onStockChange={(change) => setStock(stock + change)}
          />

          {session?.user?.role === 'admin' && (
            <AddStock
              productId={product.id}
              inventoryId={bestInventory.id}
              initialStock={stock}
              onStockChange={(change) => setStock(stock + change)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardDisplay;
