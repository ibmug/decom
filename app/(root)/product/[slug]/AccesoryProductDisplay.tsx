'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductImages from "@/components/shared/product/product-images";
import ProductPrice from "@/components/shared/product/productPrice";


type AccessoryProductDisplayProps = {
  product: {
    id: string;
    name: string;
    images: string[];
    price: string;
    stock: number;
    brand?: string;
    category?: string;
    description?: string;
    rating: string;
    numReviews: number;
  };
};

export default function AccessoryProductDisplay({ product }: AccessoryProductDisplayProps) {
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Images Column */}
        <div className="col-span-2">
          <ProductImages images={product.images} />
        </div>

        {/* Details Column */}
        <div className="col-span-2 p-5">
          <div className="flex flex-col gap-6">
            <p>{product.brand} {product.category}</p>
            <h1 className="h3-bold">{product.name}</h1>
            <p>{product.rating} of {product.numReviews}</p>
            <div className="flex-col sm:flex-row sm:items-center gap-3">
              <ProductPrice
                value={Number(product.price)}
                className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
              />
            </div>
            <div className="mt-10">
              <p className="font-semibold">Description:</p>
              <p>{product.description}</p>
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div>
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between">
                <div>Price</div>
                <div>
                  <ProductPrice value={Number(product.price)} />
                </div>
              </div>
              <div className="mb-2 flex justify-between">
                <div>Status</div>
                {product.stock > 0 ? (
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
