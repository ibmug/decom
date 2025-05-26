import { prisma } from "@/db/prisma";
import { formatError } from "../utils/utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { CardItem, Product } from "@/types";
import { insertProductSchema, updateProductSchema } from "../validators";
import { z } from 'zod';
import { Prisma } from "@prisma/client";
import { revalidatePage } from "./server/product.server.actions";

export type UIProduct = Omit<Product, "price" | "rating"> & {
  price: string;
  rating: string;
};

export interface StoreProductResult {
  id: string;
  slug: string;
  stock: number;
  price: string;
  type: "CARD" | "ACCESSORY" | "SEALED" | string;
  name: string;
  imageUrl: string;
}

export interface GetAllProductsResult {
  data: UIProduct[];
  totalPages: number;
}

export interface GetAllEnrichedProductsResult {
  data: EnrichedProduct[];
  totalPages: number;
}

interface GetProductOpts {
  page: number;
  limit: number;
  query?: string;
  category?: string;
  orderBy: keyof Product;
  order?: "asc" | "desc";
}

export async function getLatestProducts() {
  const rows = await prisma.product.findMany({
    where: {},
    orderBy: { createdAt: 'desc' },
    take: LATEST_PRODUCTS_LIMIT,
  });

  const products: Product[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    brand: p.brand,
    description: p.description,
    stock: p.stock,
    images: p.images,
    isFeatured: p.isFeatured,
    banner: p.banner,
    price: p.price.toString(),
    rating: p.rating.toString(),
    numReviews: p.numReviews,
    createdAt: p.createdAt.toISOString(),
  }));

  const totalPages = await prisma.product.count() / LATEST_PRODUCTS_LIMIT;
  return { data: products, totalPages };
}

export async function getSingleCardBySlug(slug: string) {
  const raw = await prisma.storeProduct.findUnique({
    where: { slug },
    select: {
      stock: true,
      slug: true,
      price: true,
      card: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          oracleText: true,
          setCode: true,
          manaCost: true,
          collectorNum: true,
          colorIdentity: true,
          type: true,
          rarity: true,
          setName: true, 
          usdPrice: true,
        }
      }
    }
  });

  if (!raw) return null;

  return {
    id:           raw.card?.id,
    name:         raw.card?.name,
    imageUrl:     raw.card?.imageUrl,
    oracleText:   raw.card?.oracleText,
    setCode:      raw.card?.setCode,
    collectorNum: raw.card?.collectorNum,
    colorIdentity: raw.card?.colorIdentity,
    manaCost: raw.card?.manaCost,
    type:         raw.card?.type,
    rarity:       raw.card?.rarity,
    setName:      raw.card?.setName,
    stock:        raw.stock,
    slug:         raw.slug ?? '',
    price:        raw.price.toString(),
    usdPrice: raw.card?.usdPrice
  };
}

export async function getAllFilteredProducts({
  query = "",
  page = 1,
  limit = PAGE_SIZE,
  category,
  orderBy = "createdAt",
  order = "desc",
}: GetProductOpts) {
  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = category;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: order },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, totalPages };
}

export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({ where: { id } });
    if (!productExists) throw new Error('Product was not found');
    await prisma.product.delete({ where: { id } });
    await revalidatePage('/admin/products');
    return { success: true, message: 'Deleted succesfully' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const product = insertProductSchema.parse(data);
    await prisma.product.create({ data: product });
    await revalidatePage('/admin/products');
    return { success: true, message: 'Product created succesfully.' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const existingProduct = await prisma.product.findFirst({ where: { id: product.id } });
    if (!existingProduct) throw new Error('Product not found');

    await prisma.product.update({ where: { id: product.id }, data: product });
    await revalidatePage('/admin/products');
    return { success: true, message: 'Product updated succesfully.' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function getAllCats() {
  const data = await prisma.product.groupBy({ by: ['category'], _count: true });
  return data;
}

export async function getFeaturedProducts() {
  return await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
}

export interface EnrichedProduct {
  id: string;
  cardName: string;
  stock: number;
  price: string;
  setCode: string;
  collectorNum: string;
  oracleText: string;
  colorIdentity: string[];
  imageUrl: string;
}

export async function getAllStoreProducts(page = 1): Promise<{
  data: StoreProductResult[];
  totalPages: number;
}> {
  const skip = (page - 1) * PAGE_SIZE;

  const [products, total] = await prisma.$transaction([
    prisma.storeProduct.findMany({
      include: { card: true }, // will include null if not a card
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.storeProduct.count(),
  ]);

  const data: StoreProductResult[] = products.map((p) => ({
    id: p.id,
    slug: p.slug ?? '',
    stock: p.stock,
    price: p.price.toString(),
    type: p.type,
    name: p.card?.name ?? 'Unknown',
    imageUrl: p.card?.imageUrl ?? '/images/fallback.png',
  }));

  return {
    data,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}


export async function searchCards({
  query = '',
  page = 1,
  limit = 12,
}: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CardItem[]; totalPages: number; currentPage: number }> {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  const metadataWhere: Prisma.CardMetadataWhereInput = {};
  if (terms.length) {
    metadataWhere.OR = terms.flatMap(term => [
      { name:       { contains: term, mode: 'insensitive' } },
      { type:       { contains: term, mode: 'insensitive' } },
      { oracleText: { contains: term, mode: 'insensitive' } },
    ]);
  }

 const where: Prisma.StoreProductWhereInput = {
  card: {
    is: metadataWhere,
  },
};


   const total = await prisma.storeProduct.count({ where });

  const rows = await prisma.storeProduct.findMany({
    where,
    include: { card: true},
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows
  .filter((r) => r.card) // only check for presence of card
  .map((r) => {
    const m = r.card!; // card is already CardMetadata
    return {
      id:             r.id,
      slug:           r.slug ?? '',
      stock:          r.stock,
      price:          r.price.toString(),

      name:           m.name,
      setCode:        m.setCode,
      setName:        m.setName,
      manaCost:       m.manaCost ?? '',
      collectorNum:   m.collectorNum,
      oracleText:     m.oracleText ?? '',
      colorIdentity:  m.colorIdentity,
      imageUrl:       m.imageUrl,
      rarity:         m.rarity ?? '',
      type:           m.type ?? '',
      cardKingdomUri: m.cardKingdomUri ?? undefined,
      usdPrice:       m.usdPrice ?? undefined,
      usdFoilPrice:   m.usdFoilPrice ?? undefined,
    };
  });
  
  return {
    data,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}