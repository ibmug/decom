///We're using [slug] under root/product because it's our route.(That's how typescript handles it)

import { getSingleProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";


import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCartUI } from "@/lib/actions/cart.actions";
import AccessoryProductDisplay from "./AccesoryProductDisplay";
import CardProductDisplay from "./CardProductDisplay";
import { toCardItem, toUIAccessoryDisplay } from "@/lib/utils/transformers";
import { StoreProduct } from "@prisma/client";


export const dynamic = "force-dynamic";



const ProductDetailsPage = async ({params}: { params: Promise<{ slug: string }> }) => {
    const {slug} = await params;

    
    const product = await getSingleProductBySlug(slug);
    if(!product) notFound();

    const cart = await getMyCartUI();
    if(!cart) notFound();

    const type = product.card ? 'CARD' : 'ACCESORY'

    const fixedProduct: StoreProduct = {
  id: product.id,
  slug: product.slug ?? "missing-slug",
  price: product.price,
  stock: product.stock,
  customName: product.customName,
  type: product.type,
  cardId: product.cardId,
  accessory: product.accessory,
};



    return <>
    


                        {/*I'm assuming here goes our new component. */}
                        {type === 'CARD' ? <CardProductDisplay product={toCardItem(fixedProduct)}/> : <AccessoryProductDisplay product={toUIAccessoryDisplay({...product, price: product.price.toString(), slug: product.slug ?? "missing-slug"})} />
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