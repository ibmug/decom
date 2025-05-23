// lib/actions/card.actions.ts
import { prisma } from "@/db/prisma";

export interface CardDetail {
  id: string;
  slug: string;
  stock: number;
  usdPrice: number | null;
  usdFoilPrice: number | null;
  name: string;
  setCode: string;
  setName: string;
  manaCost: string;
  collectorNum: string;
  oracleText: string;
  colorIdentity: string[];
  imageUrl: string;
  rarity: string;
  type: string;
}


function normalizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .replace(/’/g, "")              // strip fancy apostrophes
    .replace(/['"]/g, "")           // strip straight quotes
    .replace(/[\s\W-]+/g, "-")      // spaces & non-word → hyphens
    .replace(/^-+|-+$/g, "");       // trim leading/trailing hyphens
}


/**
 * Fetch a single card product by its slug, including enriched metadata and prices.
 */
export async function getSingleCardBySlug(
  rawSlug: string
): Promise<CardDetail | null> {

  // 1) decode any %20 etc.
  const decoded = decodeURIComponent(rawSlug);

  // 2) normalize exactly as seed did
  const slug = normalizeSlug(decoded);
  
  const row = await prisma.cardProduct.findFirst({
    where: { slug },
    include: { metadata: true },
  });
  if (!row) return null;

  const m = row.metadata;
  return {
    id:            row.id,
    slug:          row.slug   ,
    stock:         row.stock,
    usdPrice:      m.usdPrice,
    usdFoilPrice:  m.usdFoilPrice,
    manaCost: m.manaCost ?? "",
    name:          m.name,
    setCode:       m.setCode,
    setName: m.setName,
    collectorNum:  m.collectorNum,
    oracleText:    m.oracleText ?? "",
    colorIdentity: m.colorIdentity,
    imageUrl:      m.imageUrl,
    rarity:        m.rarity ?? "",
    type:          m.type ?? "",
  };
}

/**
 * Fetch paginated card products, mapping each to CardDetail and returning total pages.
 */
export async function getAllCardProducts(
  page: number = 1,
  limit: number = 20
): Promise<{ data: CardDetail[]; totalPages: number }> {
  const totalCount = await prisma.cardProduct.count();
  const totalPages = Math.ceil(totalCount / limit);

  const rows = await prisma.cardProduct.findMany({
    include: { metadata: true },
    skip:  (page - 1) * limit,
    take:  limit,
    orderBy: { slug: "desc" },
  });

  const data = rows.map(row => {
    const m = row.metadata;
    return {
      id:            row.id,
      slug:          row.slug,
      stock:         row.stock,
      usdPrice:      m.usdPrice,
      usdFoilPrice:  m.usdFoilPrice,
      manacost: m.manaCost,
      name:          m.name,
      setCode:       m.setCode,
      setName: m.setName,
      collectorNum:  m.collectorNum,
      oracleText:    m.oracleText ?? "",
      colorIdentity: m.colorIdentity,
      imageUrl:      m.imageUrl,
      rarity:        m.rarity,
      type:          m.type,
    };
  });

  return { data, totalPages };
}


// lib/actions/card.actions.ts
export async function getAllSets() {
  const groups = await prisma.cardMetadata.groupBy({
    by: ["setName"],              // group on the metadata’s setName
    _count: { setName: true },     // gives you how many cards per set
  });

  return groups.map(g => ({
    setName: g.setName,
    count:   g._count.setName,
  }));
}
