'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductImages from "@/components/shared/product/product-images";
import ProductPrice from "@/components/shared/product/productPrice";
import type { UIStoreProduct } from "@/types";

// Restrict to Accessory products
type AccessoryProduct = Extract<UIStoreProduct, { type: "ACCESSORY" }>;

export default function AccessoryProductDisplay({ product }: { product: AccessoryProduct }) {
  // Pull first inventory record (since we have no conditions or languages yet)
  //const firstInventory = product.inventory[0];
  const price = product.price ?? "0";
  const stock = product.inventory.reduce((sum, inv) => sum + inv.stock, 0);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Images Column */}
        <div className="col-span-2">
          <ProductImages images={product.images} />
        </div>

        {/* Details Column */}
        <div className="col-span-2 p-5 flex flex-col gap-6">
          <p>{product.brand} {product.accessory.category}</p>
          <h1 className="h3-bold">{product.accessory.name}</h1>
          {/* <p>{product.rating} out of {product.numReviews}</p> */}

          <div className="flex-col sm:flex-row sm:items-center gap-3">
            <ProductPrice
              value={Number(price)}
              className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
            />
          </div>

          <div className="mt-10">
            <p className="font-semibold">Description:</p>
            <p>{product.accessory.description}</p>
          </div>
        </div>

        {/* Action Column */}
        <div>
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between">
                <div>Price</div>
                <ProductPrice value={Number(price)} />
              </div>
              <div className="mb-2 flex justify-between">
                <div>Status</div>
                {stock > 0 ? (
                  <Badge variant="outline">En existencia!</Badge>
                ) : (
                  <Badge variant="destructive">Agotados!</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
