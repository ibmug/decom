///We're using [slug] under root/product because it's our route.(That's how typescript handles it)

import { getSingleProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";


import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCartUI } from "@/lib/actions/cart.actions";
import AccessoryProductDisplay from "./AccesoryProductDisplay";
import CardProductDisplay from "./CardProductDisplay";
import { isCardProduct, toCardItem, toUIAccessoryDisplay } from "@/lib/utils/transformers";
import {  UIStoreProduct } from "@/types";


export const dynamic = "force-dynamic";



const ProductDetailsPage = async ({params}: { params: Promise<{ slug: string }> }) => {
    const {slug} = await params;

    
    const rawProduct = await getSingleProductBySlug(slug);
    if(!rawProduct) notFound();

    const cart = await getMyCartUI();
    if(!cart) notFound();



// Ensure this is the version with included `card` or `accessory`

const product: UIStoreProduct =
  rawProduct.cardMetadata
    ? {
        id: rawProduct.id,
        slug: rawProduct.slug ?? "missing-slug",
        price: rawProduct.price.toString(),
        stock: rawProduct.stock,
        customName: rawProduct.customName,
        type: "CARD",
        card: rawProduct.cardMetadata,
      }
    : {
        id: rawProduct.id,
        slug: rawProduct.slug ?? "missing-slug",
        price: rawProduct.price.toString(),
        stock: rawProduct.stock,
        customName: rawProduct.customName,
        type: "ACCESSORY",
        accessoryId: rawProduct.accessory.id,
        accessory: rawProduct.accessory!,
      };



const isCard = isCardProduct(product)


    return <>
    


                        {/*I'm assuming here goes our new component. */}
                        {isCard ? <CardProductDisplay product={toCardItem(product)}/> : <AccessoryProductDisplay product={toUIAccessoryDisplay(product)} />
}
                        {product.stock > 0 && (<div className="flex-center">
                            <AddToCart cart={cart} item={{
                                 id:           product.id,
                                quantity:     1,
                            }}/>
                        </div>)}
    </>;
}
export default ProductDetailsPage;