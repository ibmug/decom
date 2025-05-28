///We're using [slug] under root/product because it's our route.(That's how typescript handles it)

import { getSingleProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

import {Card, CardContent} from "@/components/ui/card"
import ProductPrice from "@/components/shared/product/productPrice"
import ProductImages from "@/components/shared/product/product-images";

import AddToCart from "@/components/shared/product/add-to-cart";
import { getMyCartUI } from "@/lib/actions/cart.actions";

export const dynamic = "force-dynamic";
const ProductDetailsPage = async ({paramz}: {paramz:{slug: string}}) => {
    const {slug} = paramz;

    const product = await getSingleProductBySlug(slug);
    if(!product) notFound();

    const cart = await getMyCartUI();
    if(!cart) notFound();


    return <>
    <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
            {/*Images Column*/}
            <div className="col-span-2">
                <ProductImages images={product.images}></ProductImages>
            </div> 
             {/* Details Column*/}
            <div className="col-span-2 p-5">
                <div className="flex flex-col gap-6">
                    <p>{product.brand}{product.category}</p>
                    <h1 className="h3-bold">{product.name}</h1>
                    <p>{product.rating.toString()} of {product.numReviews}</p>
                    <div className="flex-col sm:flex-row sm:items-center gap-3">
                        <ProductPrice value={Number(product.price)} className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"/>
                    </div>
                    <div className="mt-10">
                        <p className="font-semibold">Description:</p>
                        <p>{product.description}</p>
                    </div>
                </div>
            </div>
             {/*Action Column*/}
            <div>
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-2 flex justify-between">
                            <div>Price</div>
                            <div>
                                <ProductPrice value={Number(product.price)}/>
                            </div>
                        </div>
                        <div className="mb-2 flex justify-between">
                            <div>Status</div>
                                {product.stock > 0 ? (<Badge variant='outline'>En existencia!</Badge>) : (<Badge variant='destructive'> Agotados!</Badge>)}
                        </div>
                        {product.stock > 0 && (<div className="flex-center">
                            <AddToCart cart={cart} item={{
                                productId: product.id,
                                name: product.name,
                                slug: product.slug,
                                price: product.price.toString(),
                                qty: 1,
                                image: product.images![0],
                            }}/>
                        </div>)}
                    </CardContent>
                </Card>
                </div> 
        </div>
    </section>
    </>;
}
export default ProductDetailsPage;