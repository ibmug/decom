'use server';
import { prisma } from "@/db/prisma";
import { convertToPlainObject } from "../utils";
import { LATEST_PRODUCTS_LIMIT } from "../constants";

export async function getLatestProducts() {


    const data = await prisma.product.findMany({
        take: LATEST_PRODUCTS_LIMIT,
        orderBy: { createdAt: 'desc'}
    });

    const newData = convertToPlainObject(data);
    return newData.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        brand: product.brand,
        description: product.description,
        stock: product.stock,
        images: product.images,
        isFeatured: product.isFeatured,
        banner: product.banner ?? null,
        price: product.price.toString(),
        rating: product.rating.toString(),
        numReviews: product.numReviews,
        createdAt: typeof product.createdAt === "string"
        ? product.createdAt
        : product.createdAt.toISOString()
      }));
    }


    //return convertToPlainObject(data);
//}

//get single product
export async function getSingleProductBySlug(slug: string) {
    return await prisma.product.findFirst({
        where:{slug: slug},
    });
}