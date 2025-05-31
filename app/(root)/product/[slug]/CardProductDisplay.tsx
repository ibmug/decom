'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductPrice from "@/components/shared/product/productPrice";

import Image from "next/image";


type CardProductDisplayProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    setCode: string;
    setName: string;
    manaCost?: string;
    collectorNum: string;
    oracleText?: string ;
    colorIdentity: string[];
    type?: string;
    rarity?: string;
    usdPrice?: number;
    usdFoilPrice?: number;
    price: string;
    stock: number;
  };
};

export default function CardProductDisplay({ product }: CardProductDisplayProps) {
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Image Column */}
        <div className="col-span-2">
          <div className="relative w-full aspect-[3/4] rounded overflow-hidden border">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Details Column */}
        <div className="col-span-2 p-5">
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground">{product.setName} • {product.collectorNum}</p>
            <h1 className="h3-bold">{product.name}</h1>
            {product.manaCost && <p className="text-sm text-muted-foreground">Mana Cost: {product.manaCost}</p>}
            <p className="text-sm text-muted-foreground">{product.type} • {product.rarity}</p>
            <p className="text-sm text-muted-foreground">Colors: {product.colorIdentity.join(', ')}</p>
            <p className="italic mt-2">{product.oracleText}</p>

            <div className="mt-6">
              <ProductPrice
                value={Number(product.price)}
                className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
              />
              {product.usdFoilPrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Foil: ${product.usdFoilPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div>
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between">
                <div>Price</div>
                <ProductPrice value={Number(product.price)} />
              </div>
              <div className="mb-2 flex justify-between">
                <div>Status</div>
                {product.stock > 0 ? (
                  <Badge variant="outline">En existencia!</Badge>
                ) : (
                  <Badge variant="destructive">Agotado</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
