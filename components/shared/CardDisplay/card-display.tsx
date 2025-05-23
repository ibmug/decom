import Image from 'next/image';
import type { FC } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { CardDetail } from '@/lib/actions/card.actions';


interface CardDisplayProps {
  product: CardDetail;
}

const CardDisplay: FC<CardDisplayProps> = ({ product }) => {
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
          <p><strong>Stock:</strong> {product.stock}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardDisplay;
