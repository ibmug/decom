import { getSingleProductById } from "@/lib/actions/product.actions";
import {Metadata} from "next";
import { notFound } from "next/navigation";
import ProductForm from "../create/product-form";
import { toUIAccessoryDisplayGetLatest } from "@/lib/utils/transformers";
import {  UIStoreProduct } from "@/types";



export const metadata:Metadata = {
    title: 'Update Product'
}





const AdminProductUpdatePage = async (props: {
    params:Promise<{
        id: string
    }>
}) => {

    const {id} = await props.params;
    const productRaw = await getSingleProductById(id);



    if (!productRaw) return notFound();

   let productToUpdate: UIStoreProduct;

if (productRaw.type === "CARD") {
  if (!productRaw.cardMetadata) throw new Error("Missing cardMetadata for CARD");

  productToUpdate = {
    ...productRaw,
    type: "CARD",
    price: productRaw.price.toString(),
    slug: productRaw.slug ?? "missing-slug",
    cardMetadata: productRaw.cardMetadata,
  };
} else if (productRaw.type === "ACCESSORY") {
  if (!productRaw.accessory) throw new Error("Missing accessory for ACCESSORY");

  productToUpdate = {
    ...toUIAccessoryDisplayGetLatest({
      ...productRaw,
      price: productRaw.price.toString(),
      type: "ACCESSORY",
      accessoryId: productRaw.accessoryId!,
      accessory: productRaw.accessory,
    }),
  };
} else {
  throw new Error("Unknown product type");
}


  


    return ( <div className="space-y-8 max-w-5xl mx-auto">
            <h1 className = "h2-bold"> Update Product</h1>
            <ProductForm type='UPDATE' product={productToUpdate} productId={productToUpdate.id}/>
        </div> );
}
 
export default AdminProductUpdatePage;