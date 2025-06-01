import { prisma } from "@/db/prisma";
import { CardItem, Product } from "@/types";
import { Prisma } from "@prisma/client";


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

export async function getSingleCardBySlug(slug: string) {
  const raw = await prisma.storeProduct.findUnique({
    where: { slug },
    select: {
      stock: true,
      slug: true,
      price: true,
      cardMetadata: {
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
    id:           raw.cardMetadata?.id,
    name:         raw.cardMetadata?.name,
    imageUrl:     raw.cardMetadata?.imageUrl,
    oracleText:   raw.cardMetadata?.oracleText,
    setCode:      raw.cardMetadata?.setCode,
    collectorNum: raw.cardMetadata?.collectorNum,
    colorIdentity: raw.cardMetadata?.colorIdentity,
    manaCost: raw.cardMetadata?.manaCost,
    type:         raw.cardMetadata?.type,
    rarity:       raw.cardMetadata?.rarity,
    setName:      raw.cardMetadata?.setName,
    stock:        raw.stock,
    slug:         raw.slug ?? '',
    price:        raw.price.toString(),
    usdPrice: raw.cardMetadata?.usdPrice
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
  cardMetadata: {
    is: metadataWhere,
  },
};


   const total = await prisma.storeProduct.count({ where });

  const rows = await prisma.storeProduct.findMany({
    where,
    include: { cardMetadata: true},
    skip: (page - 1) * limit,
    take: limit,
  });

  const data: CardItem[] = rows
  .filter((r) => r.cardMetadata) // only check for presence of card
  .map((r) => {
    const m = r.cardMetadata!; // card is already CardMetadata
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