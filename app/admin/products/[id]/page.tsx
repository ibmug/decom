import { getSingleProductById } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductForm from "../create/product-form";

export const metadata: Metadata = {
  title: "Update Product",
};

// Note: params typed as Promise<{ id: string }>
interface AdminProductUpdatePageProps {
  params: Promise<{ id: string }>;
}

const AdminProductUpdatePage = async ({ params }: AdminProductUpdatePageProps) => {
  const { id } = await params;
  const productRaw = await getSingleProductById(id);

  if (!productRaw) return notFound();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="h2-bold">Update Product</h1>
      <ProductForm type="UPDATE" product={productRaw} productId={productRaw.id} />
    </div>
  );
};

export default AdminProductUpdatePage;
