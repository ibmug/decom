'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductPrice from "@/components/shared/product/productPrice";
import Image from "next/image";
import { useState } from "react";
import type { UIStoreProduct, UIInventory } from "@/types";

type CardOnly = Extract<UIStoreProduct, { type: "CARD" }>;

export default function CardProductDisplay({ product }: { product: CardOnly }) {
  const languages = [...new Set(product.inventory.map(inv => inv.language ?? 'Unknown'))];
  const conditions = [...new Set(product.inventory.map(inv => inv.condition ?? 'Unknown'))];

  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages[0] ?? '');
  const [selectedCondition, setSelectedCondition] = useState<string>(conditions[0] ?? '');

  const filteredInventory: UIInventory | undefined = product.inventory.find(
    inv => (inv.language ?? '') === selectedLanguage && (inv.condition ?? '') === selectedCondition
  );

  const inventoryAvailable = filteredInventory?.stock ?? 0;
  const price = filteredInventory?.price ?? '0';

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Image */}
        <div className="col-span-2">
          <div className="relative w-full aspect-[3/4] rounded overflow-hidden border">
            <Image
              src={product.images[0]}
              alt={product.cardMetadata.name}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Info */}
        <div className="col-span-2 p-5 space-y-4">
          <p className="text-muted-foreground">{product.cardMetadata.setName} • {product.cardMetadata.collectorNum}</p>
          <h1 className="h3-bold">{product.cardMetadata.name}</h1>
          {product.cardMetadata.manaCost && (
            <p className="text-sm text-muted-foreground">Mana Cost: {product.cardMetadata.manaCost}</p>
          )}
          <p className="text-sm text-muted-foreground">{product.type} • {product.cardMetadata.rarity}</p>
          <p className="text-sm text-muted-foreground">Colors: {product.cardMetadata.colorIdentity.join(', ')}</p>
          <p className="italic mt-2">{product.cardMetadata.oracleText}</p>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Language:</span>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="border rounded px-2 py-1">
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Condition selector */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Condition:</span>
            <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className="border rounded px-2 py-1">
              {conditions.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Availability */}
        <div>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span>Price:</span>
                <ProductPrice value={Number(price)} />
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                {inventoryAvailable > 0 ? (
                  <Badge variant="outline">In stock ({inventoryAvailable})</Badge>
                ) : (
                  <Badge variant="destructive">Out of stock</Badge>
                )}
              </div>

              {/* You can wire up AddToCart here later */}
              {/* <AddToCartButton productId={} inventoryId={} /> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
