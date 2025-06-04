import { CardItem, StoreProduct, UIStoreProduct } from "@/types"; // or wherever it’s defined



export function toUIAccessoryDisplay(product: StoreProduct) {
  if (!product.accessory) throw new Error("Missing accessory data");

  return {
    id: product.accessory.id,
    name: product.accessory.name,
    images: product.accessory.images ? [product.accessory.images] : [],
    price: product.price.toString(),
    stock: product.stock,
    brand: product.accessory.brand ?? undefined,
    category: product.accessory.category,
    description: product.accessory.description ?? undefined,
    rating: product.accessory.rating ?? "0.0",
    numReviews: product.accessory.numReviews ?? 0,
  };
}


export function toCardItem(product: Extract<UIStoreProduct, {type: "CARD"}>): CardItem {
  if (!product.cardMetadata) throw new Error("Missing card");
  return {
    id: product.cardMetadata.id,
    name: product.cardMetadata.name,
    setCode: product.cardMetadata.setCode,
    setName: product.cardMetadata.setName,
    manaCost: product.cardMetadata.manaCost ?? undefined,
    collectorNum: product.cardMetadata.collectorNum,
    oracleText: product.cardMetadata.oracleText ?? undefined,
    colorIdentity: product.cardMetadata.colorIdentity,
    imageUrl: product.cardMetadata.imageUrl,
    rarity: product.cardMetadata.rarity ?? undefined,
    type: product.cardMetadata.type ?? undefined,
    cardKingdomUri: product.cardMetadata.cardKingdomUri ?? undefined,
    usdPrice: product.cardMetadata.usdPrice ?? undefined,
    usdFoilPrice: product.cardMetadata.usdFoilPrice ?? undefined,
    stock: product.stock,
    slug: product.slug ?? "missing-slug",
    price: product.price.toString(),
  };
}

export function isCardProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: 'CARD' }> {
  return product.type === 'CARD';
}

export function isAccessoryProduct(product: UIStoreProduct): product is Extract<UIStoreProduct, { type: 'ACCESSORY' }> {
  return product.type === 'ACCESSORY';
}


export function toUIAccessoryDisplayGetLatest(
  p: Extract<StoreProduct, { type: 'ACCESSORY' }>
): UIStoreProduct {
  if (!p.accessory) throw new Error("Missing accessory for ACCESSORY product");

  return {
    type: 'ACCESSORY',
    id: p.id,
    slug: p.slug,
    price: p.price.toString(),
    stock: p.stock,
    customName: p.customName ?? null,
    accessory: p.accessory,
    //cardMetadata: undefined,
    name: p.accessory.name,
    rating: Number(p.accessory.rating ?? 0),
    numReviews: p.accessory.numReviews ?? 0,
    description: p.accessory.description ?? undefined,
    category: p.accessory.category,
    brand: p.accessory.brand ?? undefined, // ✅ this is fine now
    images: p.accessory.images ?? [],
  };
}
