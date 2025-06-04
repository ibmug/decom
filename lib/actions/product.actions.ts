import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError } from "../utils/utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { Product, UIStoreProduct } from "@/types";
import { insertProductSchema, updateProductSchema } from "../validators";
import { z } from 'zod';
import { Prisma } from "@prisma/client";
import { revalidatePage } from "./server/product.server.actions";
import { toCardItem, toUIAccessoryDisplayGetLatest } from "../utils/transformers";

export type UIProduct = Omit<Product, "price" | "rating"> & {
  price: string;
  rating: string;
};

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

export async function getLatestProducts(): Promise<{ data: UIStoreProduct[] }> {
  const rows = await prisma.storeProduct.findMany({
    where: {},
    orderBy: { lastUpdated: 'desc' },
    include: {
      cardMetadata: true,
      accessory: true,
    },
    take: LATEST_PRODUCTS_LIMIT,
  });

  const products: UIStoreProduct[] = rows.map((p) => {
    if (p.type === 'CARD') {
    if (!p.cardMetadata) throw new Error("Missing cardMetadata for CARD product");

    const base = toCardItem({
      ...p,
      type: 'CARD',
      price: p.price.toString(),
      slug: p.slug ?? 'missing-slug',
      cardMetadata: p.cardMetadata,
    });

    const asUIProduct: UIStoreProduct = {
      ...base,
      type: 'CARD',
      id: p.id,
      slug: p.slug,
      price: p.price.toString(),
      stock: p.stock,
      customName: p.customName ?? null,
      cardMetadata: p.cardMetadata,
      //accessory: undefined,
    };

    return asUIProduct;
  }
    if (p.type === 'ACCESSORY') {
      if (!p.accessory) throw new Error("Missing accessory for ACCESSORY product");

      return toUIAccessoryDisplayGetLatest({
        ...p,
        accessory: p.accessory!,
        price: p.price.toString(),
        type: 'ACCESSORY',
        accessoryId:p.accessoryId!,
      });
    }

    throw new Error(`Unknown product type: ${p.type}`);
  });

  return { data: products };
}



export async function getSingleProductBySlug(slug: string) {
  return await prisma.storeProduct.findFirst({
    where: { slug },
    include: {
      cardMetadata: true,
      accessory: true,
    },
  });
}

export async function getSingleProductById(productId: string) {
  const data = await prisma.product.findFirst({ where: { id: productId } });
  return convertToPlainObject(data);
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