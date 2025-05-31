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

    
    const rawProduct = await getSingleProductBySlug(slug);
    if(!rawProduct) notFound();

    const cart = await getMyCartUI();
    if(!cart) notFound();

    const type = rawProduct.card ? 'CARD' : 'ACCESORY'



// Ensure this is the version with included `card` or `accessory`

const product: StoreProduct = {
  id: rawProduct.id,
  slug: rawProduct.slug ?? "missing-slug",
  price: rawProduct.price,
  stock: rawProduct.stock,
  customName: rawProduct.customName,
  type: rawProduct.card ? 'CARD' : 'ACCESSORY',
  card: rawProduct.card ?? undefined,
  accessory: rawProduct.accessory ?? undefined,
};



    return <>
    


                        {/*I'm assuming here goes our new component. */}
                        {type === 'CARD' ? <CardProductDisplay product={toCardItem(product)}/> : <AccessoryProductDisplay product={toUIAccessoryDisplay(product)} />
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