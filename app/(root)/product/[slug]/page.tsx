import { getSingleProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { getMyCart } from "@/lib/actions/cart.actions";
import AccessoryProductDisplay from "./AccesoryProductDisplay";
import CardProductDisplay from "./CardProductDisplay";
import { isCardProduct } from "@/lib/utils/transformers";
import { UIStoreProduct } from "@/types";
import AddToCartWrapper from "@/components/shared/product/add-to-cart-wrapper";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const rawProduct = await getSingleProductBySlug(slug);
  if (!rawProduct) notFound();

  const cart = await getMyCart();
  if (!cart) notFound();

  const product: UIStoreProduct = rawProduct;

  const isCard = isCardProduct(product);
  console.log(product)

  const firstInventory = product.inventory[0];
  if(!firstInventory) notFound();

  return (
    <>
      {isCard ? (
        <CardProductDisplay product={product as Extract<UIStoreProduct, { type: "CARD" }>} />
      ) : (
        <AccessoryProductDisplay product={product as Extract<UIStoreProduct, { type: "ACCESSORY" }>} />
      )}

      {product.inventory.length > 0 && (
        <div className="flex-center">
          <AddToCartWrapper
            productId={product.id}
            inventoryId={product.inventory[0].id}
            stock={product.inventory[0].stock}
            
          />
        </div>
      )}
    </>
  );
}
