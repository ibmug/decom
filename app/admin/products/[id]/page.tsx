import { getSingleProductById } from "@/lib/actions/product.actions";
import {Metadata} from "next";
import { notFound } from "next/navigation";
import ProductForm from "../create/product-form";

export const metadata:Metadata = {
    title: 'Update Product'
}





const AdminProductUpdatePage = async (props: {
    params:Promise<{
        id: string
    }>
}) => {

    const {id} = await props.params;
    const productToUpdate = await getSingleProductById(id);

    if (!productToUpdate) return notFound();

    return ( <div className="space-y-8 max-w-5xl mx-auto">
            <h1 className = "h2-bold"> Update Product</h1>
            <ProductForm type='UPDATE' product={productToUpdate} productId={productToUpdate.id}/>
        </div> );
}
 
export default AdminProductUpdatePage;