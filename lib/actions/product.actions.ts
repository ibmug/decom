
import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError, serializeProduct } from "../utils/utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { Product } from "@/types";
import { insertProductSchema, updateProductSchema } from "../validators";
import {z} from 'zod'
import type { Prisma } from "@prisma/client";
import { revalidatePage } from "./server/product.server.actions";



/**
 * UIProduct is exactly like Prisma’s Product, except
 * price & rating have been turned into strings.
 */
export type UIProduct = Omit<Product, "price" | "rating"> & {
  price:  string;
  rating: string;
};

export interface GetAllProductsResult {   // for your regular products
  data: UIProduct[];
  totalPages: number;
}

export interface GetAllEnrichedProductsResult { // for card-enriched “products”
  data: EnrichedProduct[];
  totalPages: number;
}

// interface GetAllProductsParams {
//   query:    string;
//   page:     number;
//   category: string;
//   rating:   string;
//   price:    string;
//   sort:     string;
// }

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


    const rows = await prisma.product.findMany({
  where:      { /* … */ },
  orderBy:    { createdAt: 'desc' },
  take: LATEST_PRODUCTS_LIMIT,
});

    const products: Product[] = rows.map((p) => ({
  id:          p.id,
  name:        p.name,
  slug:        p.slug,
  category:    p.category,
  brand:       p.brand,
  description: p.description,
  stock:       p.stock,
  images:      p.images,
  isFeatured:  p.isFeatured,
  banner:      p.banner,
  
  // Convert Decimal → string explicitly:
  price:       p.price.toString(),
  rating:      p.rating.toString(),
  
  numReviews:  p.numReviews,
  
  // Convert Date → string if your UI expects a string:
  createdAt:   p.createdAt.toISOString(),
}));
  const totalPages = await prisma.product.count()/LATEST_PRODUCTS_LIMIT
    return {
      data: products,
      totalPages: totalPages
    };
  }

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

// export async function getAllProducts(
//     params: GetAllProductsParams
// ):Promise<GetAllProductsResult> {

//     const {query, category, price, rating, sort, page} = params;
//   console.log(sort)

    

//     //query Filter
//     const queryFilter: Prisma.ProductWhereInput = query && query !== 'all' ? {
//         name: {contains: query, mode: 'insensitive'},
        
//     } as Prisma.ProductWhereInput : {};

//     //Category Filter
//     const categoryFilter = category && category !== 'all' ? {category} : {};

//     //Rating Filter
//     const ratingFilter = rating && rating !=='all' ? {rating:{
//         gte:Number(rating)
//     }} : {}

//     //Price Filter
//     const priceFilter = price && price !== 'all' ? {price:{
//         gte:Number(price.split('-')[0]),
//         lte:Number(price.split('-')[1])
//     }} : {};
//     //console.log(sort)


//     const data = await prisma.product.findMany({
//         orderBy: {createdAt: 'desc'},
//         where: {
//             ...queryFilter,
//             ...categoryFilter,
//             ...priceFilter,
//             ...ratingFilter
//         },
//         skip:(page-1) * PAGE_SIZE,
//         take: PAGE_SIZE
//     });

//     ///This is to change it so that the UI can accept it.
//     const rawRows : Product[] = data;
//     const theData: UIProduct[] = rawRows.map((p)=>({
//         ...p,
//         price:p.price.toString(),
//         rating:p.rating.toString()
//     }))

//     const dataCount = await prisma.product.count();

//     return {
//         data: theData,
//         totalPages: Math.ceil(dataCount / PAGE_SIZE),
//     };
// }


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

        await revalidatePage('/admin/products')
        

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

        //revalidatePath('/admin/products')

        await revalidatePage('/admin/products');

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

        //revalidatePath('/admin/products')
        await revalidatePage('/admin/products');

        return {success:true, message: 'Product updated succesfully.'}

    }catch(err){
        return {success: false, message: formatError(err)}
    }
}

//get all categories

export async function getAllCats() {
    const data = await prisma.product.groupBy({
        by:['category'],
        _count:true
    })
    
    return data
}


///get featured products
export async function getFeaturedProducts(){
    const data = await prisma.product.findMany({
        where: {isFeatured: true},
        orderBy: {createdAt:'desc'},
        take: 4,
    });

    return data 
}


///Lets start talking cards...
export interface EnrichedProduct {
  id:            string;
  cardName:      string;
  stock:         number;
  price:         string;
  setCode:       string;
  collectorNum:  string;
  oracleText:    string;
  colorIdentity: string[];
  imageUrl:      string;
}

// export interface GetAllProductsResult {
//   data:       EnrichedProduct[];
//   totalPages: number;
// }

interface FilterParams {
  name:     string;
  color:    string;
  manaCost: string;
  price:    string;
  set:      string;
  rarity:   string;
  page:     number;
}

export async function getAllProductsEnriched({
  name, color, manaCost, price, set, rarity, page,
}: FilterParams): Promise<GetAllEnrichedProductsResult> {
  // build your individual filters
  const nameFilter: Prisma.StringFilter | undefined     = name     !== "all" ? { contains: name, mode: "insensitive" } : undefined;
  const colorFilter:  Prisma.StringNullableListFilter | undefined  = color    !== "all" ? { has: color } : undefined;
  // …similar for manaCost, set, rarity…
  console.log(name,color,manaCost,price,set,rarity)

  const priceFilter    = price !== "all"
    ? {
        gte: Number(price.split("-")[0]),
        lte: Number(price.split("-")[1]),
      }
    : undefined;

  const PAGE_SIZE = 20;
  const skip      = (page - 1) * PAGE_SIZE;
  const take      = PAGE_SIZE;

  // fetch products joined with metadata
  const raws = await prisma.cardProduct.findMany({
    include: { metadata: true },
    where: {
      // price & stock lives on cardProduct
      price: priceFilter,
      // metadata‐based filters:
      metadata: {
        is:{
          ...(nameFilter     && { name: nameFilter }),
          ...(colorFilter    && { colorIdentity: colorFilter }),
          // …
        }
      },
    },
    orderBy: { metadata: { name: "desc" } },
    skip,
    take,
  });

  // map to your EnrichedProduct
  const data: EnrichedProduct[] = raws.map((p) => ({
    id:            p.id,
    cardName:      p.metadata.name,
    stock:         p.stock,
    price:         p.price.toString(),
    setCode:       p.metadata.setCode,
    collectorNum:  p.metadata.collectorNum,
    oracleText:    p.metadata.oracleText ?? "",
    colorIdentity: p.metadata.colorIdentity,
    imageUrl:      p.metadata.imageUrl,
  }));

  // total count for pagination
  const total = await prisma.cardProduct.count({
    where: {
      price: priceFilter,
      metadata: {
        ...(nameFilter     && { name: nameFilter }),
        ...(colorFilter    && { colorIdentity: colorFilter }),
        // …
      },
    },
  });

  return {
    data,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}


export async function getAllProducts({
  query    = "",
  category = "all",
  price    = "all",
  rating   = "all",
  sort     = "newest",
  page     = 1,
  limit    = PAGE_SIZE,
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
  // 1) Text search: split into terms
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t);

  // 2) Build the where clause
  const where: Prisma.ProductWhereInput = {};

  if (terms.length) {
    where.OR = terms.flatMap((term) => [
      { name:        { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { category:    { contains: term, mode: "insensitive" } },
      { brand:       { contains: term, mode: "insensitive" } },
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

  // 3) Determine sort order
  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : { createdAt: "asc" as const };

  // 4) Count + fetch
  const totalCount = await prisma.product.count({ where });
  const rows = await prisma.product.findMany({
    where,
    orderBy,
    skip:  (page - 1) * limit,
    take:  limit,
  });

  // 5) Serialize to UI shape
  const data = rows.map(serializeProduct);

  return {
    data,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}
