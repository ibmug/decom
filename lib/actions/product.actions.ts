import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError, serializeProduct } from "../utils/utils";
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

interface FilterParams {
  name: string;
  color: string;
  manaCost: string;
  price: string;
  set: string;
  rarity: string;
  page: number;
}

export async function getAllProductsEnriched({
  name, color, manaCost, price, set, rarity, page,
}: FilterParams): Promise<GetAllEnrichedProductsResult> {
 const nameFilter = name !== "all"
  ? { contains: name, mode: Prisma.QueryMode.insensitive }
  : undefined;
  const colorFilter = color !== "all" ? { has: color } : undefined;

  const priceFilter = price !== "all" ? {
    gte: Number(price.split("-")[0]),
    lte: Number(price.split("-")[1]),
  } : undefined;

  const skip = (page - 1) * PAGE_SIZE;
  const take = PAGE_SIZE;

  console.log(`gettingallenriched ${manaCost} ${set} ${rarity}`)

  const raws = await prisma.storeProduct.findMany({
    include: { card: true },
    where: {
      type: "CARD",
      price: priceFilter,
      card: {
        isNot:null,
        is: {
          ...(nameFilter && { name: nameFilter }),
          ...(colorFilter && { colorIdentity: colorFilter }),
        },
      },
    },
    orderBy: { card: { name: "desc" } },
    skip,
    take,
  });

  function hasCard(p: typeof raws[number]): p is typeof p & { card: NonNullable<typeof p.card> } {
    return p.card !== null;
  }

  const data: EnrichedProduct[] = raws
    .filter(hasCard)
    .map((p) => ({
      id:           p.id,
      cardName:     p.card.name,
      stock:        p.stock,
      price:        p.price.toString(),
      setCode:      p.card.setCode,
      collectorNum: p.card.collectorNum,
      oracleText:   p.card.oracleText ?? '',
      colorIdentity: p.card.colorIdentity,
      imageUrl:     p.card.imageUrl,
    }));

  const total = await prisma.storeProduct.count({
    where: {
      type: "CARD",
      price: priceFilter,
      card: {
        ...(nameFilter && { name: nameFilter }),
        ...(colorFilter && { colorIdentity: colorFilter }),
      },
    },
  });

  return {
    data,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getAllProducts({
  query = "",
  category = "all",
  price = "all",
  rating = "all",
  sort = "newest",
  page = 1,
  limit = PAGE_SIZE,
}: {
  query?: string;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: UIProduct[];
  totalPages: number;
  currentPage: number;
}> {
  const terms = query.trim().split(/\s+/).filter((t) => t);
  const where: Prisma.ProductWhereInput = {};

  if (terms.length) {
    where.OR = terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
    ]);
  }

  if (category !== "all") {
    where.category = category;
  }

  if (price !== "all") {
    const [min, max] = price.split("-").map(Number);
    where.price = { gte: min, lte: max };
  }

  if (rating !== "all") {
    where.rating = { gte: Number(rating) };
  }

  const orderBy = sort === "newest" ? { createdAt: "desc" as const } : { createdAt: "asc" as const };

  const totalCount = await prisma.product.count({ where });
  const rows = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  const data = rows.map(serializeProduct);
  return {
    data,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

