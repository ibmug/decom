import { getSingleProductBySlug, getAllProducts, getLatestProducts } from "@/lib/actions/product.actions";
import { toUICatalogProduct } from "@/lib/utils/transformers";
import { UICatalogProduct } from "@/types";

// Get single product (flattened for frontend)
export async function getUICatalogProductBySlug(slug: string): Promise<UICatalogProduct | null> {
  const raw = await getSingleProductBySlug(slug);
  if (!raw) return null;
  return toUICatalogProduct(raw);
}

// Get latest products for homepage (flattened)
export async function getLatestCatalogProducts(): Promise<UICatalogProduct[]> {
  const raw = await getLatestProducts();
  return raw.map(toUICatalogProduct);
}

// Get all products for admin/search pages (flattened)
export async function getAllCatalogProducts(): Promise<UICatalogProduct[]> {
  const raw = await getAllProducts();
  return raw.map(toUICatalogProduct);
}
