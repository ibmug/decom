import { Prisma, StoreProduct, Inventory, CardMetadata, AccessoryProduct } from "@prisma/client";
import { CardItem, UIStoreProduct, UIInventory, UICatalogProduct } from "@/types";

// === Inventory Mapper ===
export function mapInventory(
  inventories: {
    id: string;
    stock: number;
    language?: string | null;
    condition?: string | null;
  }[] = []
): UIInventory[] {
  return inventories.map((inv) => ({
    id: inv.id,
    stock: inv.stock,
    language: inv.language ?? "English",
    condition: inv.condition ?? "NM",
  }));
}

// === StoreProduct → UIStoreProduct ===
export function storeProductToUIStoreProduct(p: {
  id: string;
  slug: string;
  type: "CARD" | "ACCESSORY";
  cardMetadata?: CardMetadata | null;
  accessory?: AccessoryProduct | null;
  inventory?: {
    id: string;
    stock: number;
    language?: string | null;
    condition?: string | null;
  }[];
  price: Prisma.Decimal | string;  // <== tiny fix for flexibility here
  rating?: number | null;
  numReviews?: number | null;
  images?: string[] | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
}): UIStoreProduct | null {
  const inventory = mapInventory(p.inventory ?? []);
  const priceString = typeof p.price === "string" ? p.price : p.price.toString();

  if (p.type === "CARD") {
    if (!p.cardMetadata) {
      console.warn("Skipping CARD without metadata:", p.id);
      return null;
    }
    return {
      id: p.id,
      slug: p.slug,
      type: "CARD",
      cardMetadata: p.cardMetadata,
      inventory,
      price: priceString,
      rating: p.rating ?? 0,
      numReviews: p.numReviews ?? 0,
      images: p.images ?? [],
    };
  }

  if (p.type === "ACCESSORY") {
    if (!p.accessory) {
      console.warn("Skipping ACCESSORY without accessory relation:", p.id);
      return null;
    }
    return {
      id: p.id,
      slug: p.slug,
      type: "ACCESSORY",
      accessory: p.accessory,
      inventory,
      price: priceString,
      rating: p.rating ?? 0,
      numReviews: p.numReviews ?? 0,
      images: p.images ?? [],
      description: p.description ?? undefined,
      category: p.category ?? undefined,
      brand: p.brand ?? undefined,
    };
  }

  console.warn("Unknown product type:", p);
  return null;
}

// === UIStoreProduct → UICatalogProduct ===
export function toUICatalogProduct(product: UIStoreProduct): UICatalogProduct {
  const stock = product.inventory.reduce((sum, i) => sum + i.stock, 0);

  if (product.type === "CARD") {
    const meta = product.cardMetadata!;
    return {
      id: product.id,
      slug: product.slug,
      type: "CARD",
      name: meta.name,
      setCode: meta.setCode,
      setName: meta.setName,
      collectorNum: meta.collectorNum,
      oracleText: meta.oracleText ?? undefined,
      colorIdentity: meta.colorIdentity,
      images: product.images ?? [],
      price: product.price,
      stock,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      inventory: product.inventory,
    };
  }

  if (product.type === "ACCESSORY") {
    const acc = product.accessory!;
    return {
      id: product.id,
      slug: product.slug,
      type: "ACCESSORY",
      name: acc.name,
      accessory: acc,
      inventory: product.inventory,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      images: product.images ?? [],
      description: product.description ?? undefined,
      category: product.category ?? undefined,
      brand: product.brand ?? undefined,
      price: product.price,
      stock,
    };
  }

  throw new Error("Unknown product type");
}

// === UIStoreProduct → CardItem ===
export function toCardItem(product: Extract<UIStoreProduct, { type: "CARD" }>): CardItem {
  const meta = product.cardMetadata;
  return {
    id: meta.id,
    productId: product.id,
    name: meta.name,
    setCode: meta.setCode,
    setName: meta.setName,
    manaCost: meta.manaCost ?? undefined,
    collectorNum: meta.collectorNum,
    oracleText: meta.oracleText ?? undefined,
    colorIdentity: meta.colorIdentity,
    images: product.images ?? [],
    backsideImageUrl: undefined,
    rarity: meta.rarity ?? undefined,
    type: meta.type ?? undefined,
    usdPrice: meta.usdPrice ?? undefined,
    usdFoilPrice: meta.usdFoilPrice ?? undefined,
    slug: product.slug,
    price: product.price,
    stock: product.inventory.reduce((sum, i) => sum + i.stock, 0),
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    inventory: product.inventory,
  };
}

// === ProductWithRelations type ===
export type ProductWithRelations = StoreProduct & {
  cardMetadata: CardMetadata | null;
  accessory: AccessoryProduct | null;
  inventory: Inventory[];
};

// === Type Guards ===
export function isCardProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: "CARD" }> {
  return product.type === "CARD";
}

export function isAccessoryProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: "ACCESSORY" }> {
  return product.type === "ACCESSORY";
}
