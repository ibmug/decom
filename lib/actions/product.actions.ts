import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError } from "../utils/utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { Product } from "@/types";
import { insertProductSchema, updateProductSchema } from "../validators";
import { z } from 'zod';
import { Prisma } from "@prisma/client";
import { revalidatePage } from "./server/product.server.actions";

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

export async function getSingleProductBySlug(slug: string) {
  return await prisma.product.findFirst({ where: { slug } });
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
  try{
  const data = await prisma.product.groupBy({ by: ['category'], _count: true });
  return data;
  }catch(err){
    console.log(err)
    return;
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