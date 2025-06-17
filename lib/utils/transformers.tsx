import { Prisma, StoreProduct, Inventory, CardMetadata, AccessoryProduct } from "@prisma/client";
import { CardItem, UIStoreProduct, UIInventory, UICatalogProduct } from "@/types";



// === STORE PRODUCT -> UIStoreProduct ===
export function mapInventory(
  inventories: {
    id: string;
    price: Prisma.Decimal;
    stock: number;
    language?: string | null;
    condition?: string | null;
  }[] = []  // <-- default empty if undefined
): UIInventory[] {
  return inventories.map((inv) => ({
    id: inv.id,
    price: inv.price.toString(),
    stock: inv.stock,
    language: inv.language ?? undefined,
    condition: inv.condition ?? undefined,
  }));
}

// === STORE PRODUCT -> UIStoreProduct ===
export function storeProductToUIStoreProduct(p: {
  id: string;
  slug: string;
  type: "CARD" | "ACCESSORY";
  cardMetadata?: CardMetadata | null;
  accessory?: AccessoryProduct | null;
  inventory?: {
    id: string;
    price: Prisma.Decimal;
    stock: number;
    language?: string | null;
    condition?: string | null;
  }[];
  rating?: number | null;
  numReviews?: number | null;
  images?: string[] | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
}): UIStoreProduct | null {
  const inventory = mapInventory(p.inventory ?? []);

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


// === UIStoreProduct -> UICatalogProduct ===
export function toUICatalogProduct(product: UIStoreProduct): UICatalogProduct {
  const sortedInventory = [...product.inventory].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  const bestInventory = sortedInventory[0];

  const price = bestInventory?.price ?? "0";
  const stock = product.inventory.reduce((sum, i) => sum + i.stock, 0);

  if (product.type === "CARD") {
    const meta = product.cardMetadata;

    // Added extra defensive layer even though storeProductToUIStoreProduct already handles missing cardMetadata
    return {
      id: product.id,
      slug: product.slug,
      type: "CARD",
      name: meta?.name ?? "Unknown Card",
      setCode: meta?.setCode ?? "",
      setName: meta?.setName ?? "",
      collectorNum: meta?.collectorNum ?? "",
      oracleText: meta?.oracleText ?? undefined,
      colorIdentity: meta?.colorIdentity ?? [],
      images: product.images ?? [],
      price,
      stock,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      inventory: product.inventory,
    };
  }

  if (product.type === "ACCESSORY") {
    const acc = product.accessory;

    return {
      id: product.id,
      slug: product.slug,
      type: "ACCESSORY",
      name: acc?.name ?? "Unknown Accessory",
      accessory: acc,
      inventory: product.inventory,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      images: product.images ?? [],
      description: product.description ?? undefined,
      category: product.category ?? undefined,
      brand: product.brand ?? undefined,
      price: bestInventory?.price ?? "0",
      stock: bestInventory?.stock ?? 0,
    };
  }

  throw new Error("Unknown product type");
}


// === UIStoreProduct -> CardItem (frontend use) ===
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
    imageUrl: product.images?.[0] ?? "",
    backsideImageUrl: undefined,
    rarity: meta.rarity ?? undefined,
    type: meta.type ?? undefined,
    usdPrice: meta.usdPrice ?? undefined,
    usdFoilPrice: meta.usdFoilPrice ?? undefined,
    slug: product.slug,
    price: product.inventory[0]?.price ?? "0",
    stock: product.inventory.reduce((sum, i) => sum + i.stock, 0),
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    inventory: product.inventory,
  };
}

// === ProductWithRelations for backend reads ===
export type ProductWithRelations = StoreProduct & {
  cardMetadata: CardMetadata | null;
  accessory: AccessoryProduct | null;
  inventory: Inventory[];
};

// === CartRecord for cart actions ===
export type CartRecord = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        storeProduct: {
          include: { cardMetadata: true; accessory: true };
        };
        inventory: true;
      };
    };
  };
}>;

// === Transform Cart Record ===
export function transformCartRecord(cart: CartRecord) {
  return {
    ...cart,
    items: cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      storeProduct: {
        id: item.storeProduct.id,
        slug: item.storeProduct.slug,
        type: item.storeProduct.type,
        images: item.storeProduct.images ?? [],
        cardMetadata: item.storeProduct.cardMetadata
          ? { name: item.storeProduct.cardMetadata.name }
          : null,
        accessory: item.storeProduct.accessory
          ? { name: item.storeProduct.accessory.name }
          : null,
      },
      inventory: item.inventory
        ? {
            id: item.inventory.id,
            price: item.inventory.price.toString(),
            stock: item.inventory.stock,
            language: item.inventory.language ?? undefined,
            condition: item.inventory.condition ?? undefined,
          }
        : {
            id: "",
            price: "0.00",
            stock: 0,
            language: undefined,
            condition: undefined,
          },
    })),
    itemsPrice: cart.itemsPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
  };
}


// === Type guards ===
export function isCardProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: "CARD" }> {
  return product.type === "CARD";
}

export function isAccessoryProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: "ACCESSORY" }> {
  return product.type === "ACCESSORY";
}
