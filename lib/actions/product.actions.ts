'use server';

import { prisma } from '@/db/prisma';
import { UIStoreProduct } from '@/types';
import { ProductWithRelations, storeProductToUIStoreProduct } from '@/lib/utils/transformers';

// Common include fields (StoreProduct level + relations)
const baseInclude = {
  cardMetadata: true,
  accessory: true,
  inventory: true,
};

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

  return products.map(p => storeProductToUIStoreProduct(p as ProductWithRelations));
}

// Get all products for admin products page:
export async function getAllProducts(): Promise<UIStoreProduct[]> {
  const products = await prisma.storeProduct.findMany({
    orderBy: { updatedAt: 'desc' },
    include: baseInclude,
  });

  return products.map(p => storeProductToUIStoreProduct(p as ProductWithRelations));
}
