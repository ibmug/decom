'use server';
import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError } from "../utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { Product } from "@/types";
import { revalidatePath } from "next/cache";
import { insertProductSchema, updateProductSchema } from "../validators";
import {z} from 'zod'
import { Prisma } from "@prisma/client";

//These are the options provided by the params in the admin user page.
interface GetProductOpts {
  page:number
  limit: number
  query?: string
  category?: string
  orderBy: keyof Product
  order?: "asc" | "desc"
}

export async function getLatestProducts() {


    const data = await prisma.product.findMany({
        take: LATEST_PRODUCTS_LIMIT,
        orderBy: { createdAt: 'desc'}
    });

    const newData = convertToPlainObject(data) as Product[];
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

//get product by id
export async function getSingleProductById(productId: string) {
    
    const data = await prisma.product.findFirst({
        where:{id: productId},
    }) 
    return convertToPlainObject(data);
}



//get all products

export async function getAllProducts({
    query,
    //limit = PAGE_SIZE,
    limit=10,
    page,
    category
}: {
    query: string;
    limit?: number;
    page: number;
    category?: string;
}){
    const data = await prisma.product.findMany({
        skip:(page-1) * limit,
        take: limit
    });

    const dataCount = await prisma.product.count();

    const helper = {query, category}
    console.log(helper)

    return {
        data,
        totalPages: Math.ceil(dataCount / limit),
    };
}


///get all 'filtered' products:
export async function getAllFilteredProducts({
    query    = "",
    page     = 1,
    limit    = PAGE_SIZE,
    category,
    orderBy  = "createdAt",   // sensible default
    order    = "desc",        // sensible default
  }: GetProductOpts) {
    // 3) Build a proper ProductWhereInput
    const where: Prisma.ProductWhereInput = {}
  
    if (category) {
      where.category = category
    }
    if (query) {
      where.OR = [
        { name:        { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { slug:        { contains: query, mode: "insensitive" } },
      ]
    }
  
    // 4) Fire off both queries in a transaction
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { [orderBy]: order },
      }),
      prisma.product.count({ where }),
    ])
  
    // 5) Compute pages and return
    const totalPages = Math.ceil(total / limit)
    return { data, totalPages }
  }

//delete a product

export async function deleteProduct(id:string){
    try{
        const productExists = await prisma.product.findFirst({
            where:{id}
        });
        if(!productExists) throw new Error('Product was not found');

        await prisma.product.delete({where:{id}});

        revalidatePath('/admin/products');
        

        return {success: true, message: 'Deleted succesfully'} 

    }catch(err){
        return {success: false, message: formatError(err)}
    }
}


///Create a product

export async function createProduct(data: z.infer<typeof insertProductSchema>){
    try{
        const product = insertProductSchema.parse(data);
        await prisma.product.create({data: product})

        revalidatePath('/admin/products')
        return {success:true, message: 'Product created succesfully.'}

    }catch(err){
        return {success: false, message: formatError(err)}
    }
}


export async function updateProduct(data: z.infer<typeof updateProductSchema>){
    try{
        const product = updateProductSchema.parse(data);
        const existingProduct = await prisma.product.findFirst({where:{id:product.id}})
        if(!existingProduct) throw new Error ('Product not found');

        await prisma.product.update({
            where: {id:product.id},
            data: product
        });

        revalidatePath('/admin/products')
        return {success:true, message: 'Product updated succesfully.'}

    }catch(err){
        return {success: false, message: formatError(err)}
    }
}

