'use server';

import { prisma } from '@/db/prisma';
import { UIStoreProduct } from '@/types';
import { ProductWithRelations, storeProductToUIStoreProduct } from '@/lib/utils/transformers';
import {  isNotNull, isUIStoreProduct } from '../utils/typeguards';

// Common include fields (StoreProduct level + relations)
const baseInclude = {
  cardMetadata: true,
  accessory: true,
  inventory: true,
};


///get produts paginated:
export async function getProductsPaginated(page: number = 1, limit: number = 50): Promise<UIStoreProduct[]> {
  const offset = (page - 1) * limit;

  const products = await prisma.storeProduct.findMany({
    skip: offset,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: baseInclude,
  });

  return products
    .map(p => {
      try {
        return storeProductToUIStoreProduct(p as ProductWithRelations);
      } catch (err) {
        console.error("Skipping broken product:", p.id, err);
        return null;
      }
    })
    .filter((p): p is UIStoreProduct => p !== null);
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
  const raw = await prisma.storeProduct.findMany({ /* ... */ });
  return raw
    .map(p => {
      try {
        return storeProductToUIStoreProduct(p as ProductWithRelations);
      } catch (err) {
        console.warn('Skipping invalid product', p.id, err);
        return null;
      }
    })
    .filter(isNotNull);
}



// Get all products for admin products page:
export async function getAllProducts(): Promise<UIStoreProduct[]> {
  const products = await prisma.storeProduct.findMany({
    orderBy: { updatedAt: 'desc' },
    include: baseInclude,
  })

  return products
    .map(p => {
      try {
        return storeProductToUIStoreProduct(p as ProductWithRelations)
      } catch (err) {
        console.warn('Skipping invalid product', p.id, err)
        return null
      }
    })
    .filter(isUIStoreProduct)
}