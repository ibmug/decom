'use server';

import { prisma } from '@/db/prisma';
import { UIStoreProduct } from '@/types';
import { ProductWithRelations, storeProductToUIStoreProduct } from '@/lib/utils/transformers';


// Common include fields (StoreProduct level + relations)
const baseInclude = {
  id: true,
  slug: true,
  type: true,
  cardMetadata: true,
  accessory: true,
  inventory: true,
  rating: true,
  numReviews: true,
  images: true,
  storeId: true,
};


///get produts paginated:
export async function getProductsPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;

  return prisma.storeProduct.findMany({
    skip,
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      inventory: true,
      cardMetadata: true,
      accessory: true,
    },
  });
}

// Optional: count total pages (optional for now)
export async function getProductsTotalCount(): Promise<number> {
  return await prisma.storeProduct.count();
}


// Fetch a single product by ID (admin usage)
export async function getSingleProductById(id: string): Promise<UIStoreProduct | null> {
  const product = await prisma.storeProduct.findUnique({
    where: { id },
    include: baseInclude,
  });

  if (!product) return null;

  return storeProductToUIStoreProduct(product as ProductWithRelations);
}

// Fetch a product by slug (client usage)
export async function getSingleProductBySlug(slug: string): Promise<UIStoreProduct | null> {
  const product = await prisma.storeProduct.findUnique({
    where: { slug },
    include: baseInclude,
  });

  if (!product) return null;

  return storeProductToUIStoreProduct(product as ProductWithRelations);
}

// Get latest products for homepage:
export async function getLatestProducts(): Promise<UIStoreProduct[]> {
  const products = await prisma.storeProduct.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: baseInclude,
  });

  const converted = products.map((p) => {
    try {
      return storeProductToUIStoreProduct(p as ProductWithRelations);
    } catch (err) {
      console.warn('Skipping invalid product', p.id, err);
      return null;
    }
  });

  return converted.filter((p): p is UIStoreProduct => p !== null);
}



// Get all products for admin products page:
export async function getAllProducts(): Promise<UIStoreProduct[]> {
  const products = await prisma.storeProduct.findMany({
    orderBy: { updatedAt: 'desc' },
    include: baseInclude,
  });

  const converted = products.map((p) => {
    try {
      return storeProductToUIStoreProduct(p as ProductWithRelations);
    } catch (err) {
      console.warn('Skipping invalid product', p.id, err);
      return null;
    }
  });

  // Type-safe filter to remove nulls
  return converted.filter((p): p is UIStoreProduct => p !== null);
}
