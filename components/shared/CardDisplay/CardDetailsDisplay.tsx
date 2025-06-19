'use client'
import { useState, useMemo } from "react";
import { Card, CardContent } from '@/components/ui/card';
import {UIInventory, UIStoreProduct} from '@/types'
import ProductPrice from "@/components/shared/product/productPrice";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "../add-to-cart-button";
import PriceEditor from "./PriceEditor";
import AdminInventoryManager from "./AdminInventoryManager";
import ManaCost from "../manacost";




type CardOnly = Extract<UIStoreProduct, { type: "CARD" }>;

interface Props {
  product: CardOnly;
  isAdminOrManager: boolean;
}

export default function CardDetailsDisplay({ product, isAdminOrManager }: Props) {

  const firstImage = product.images?.[0] ?? '/images/cardPlaceholder.png';
  const languages = useMemo(() => [...new Set(product.inventory.map(inv => inv.language ?? 'Unknown'))], [product.inventory]);
  const conditions = useMemo(() => [...new Set(product.inventory.map(inv => inv.condition ?? 'Unknown'))], [product.inventory]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages[0] ?? '');
  const [selectedCondition, setSelectedCondition] = useState<string>(conditions[0] ?? '');

  const filteredInventory: UIInventory | undefined = product.inventory.find(
    inv => (inv.language ?? '') === selectedLanguage && (inv.condition ?? '') === selectedCondition
  );

  const inventoryAvailable = filteredInventory?.stock ?? 0;
  const price = product?.price.toString();


  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Image */}
        <div className="col-span-2">
          <div className="relative w-full aspect-[3/4] rounded overflow-hidden border">
            <Image
              src={firstImage}
              alt={product.cardMetadata.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
        {/* Info */}
        <div className="col-span-2 p-5 space-y-4">
          <h1 className="h3-bold">{product.cardMetadata.name}</h1>
          <p className="text-muted-foreground">{product.cardMetadata.setName}</p>
          {product.cardMetadata.manaCost && (
            <p className="text-sm text-muted-foreground">Mana Cost: {<ManaCost cost={product.cardMetadata.manaCost ?? "No Mana Cost"} size={18}/>}</p>
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
                {isAdminOrManager && filteredInventory ? (
                  <PriceEditor productId={product.id} currentPrice={price} />
                ) : (
                  <ProductPrice value={Number(price)} />
                )}
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                {inventoryAvailable > 0 ? (
                  <Badge variant="outline">In stock ({inventoryAvailable})</Badge>
                ) : (
                  <Badge variant="destructive">Out of stock</Badge>
                )}
              </div>

              {filteredInventory && (
                // eslint-disable-next-line react/jsx-no-undef
                <AddToCartButton
                  productId={product.id}
                  inventoryId={filteredInventory.id}
                  stock={inventoryAvailable}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Inventory Manager */}
      {isAdminOrManager && (
        <div className="mt-10">
          <AdminInventoryManager productId={product.id} />
        </div>
      )}
    </section>
  );
}
