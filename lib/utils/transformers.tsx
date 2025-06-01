import { StoreProduct, UIStoreProduct } from "@/types"; // or wherever it’s defined

export function toUICardDisplay(product: StoreProduct) {
  if (!product.card) throw new Error("Card data missing in StoreProduct");

  return {
    id: product.card.id,
    slug: product.slug ?? "missing-slug",
    name: product.card.name,
    imageUrl: product.card.imageUrl,
    setCode: product.card.setCode,
    setName: product.card.setName,
    manaCost: product.card.manaCost ?? undefined,
    collectorNum: product.card.collectorNum,
    oracleText: product.card.oracleText ?? undefined,
    colorIdentity: product.card.colorIdentity,
    type: product.card.type ?? undefined,
    rarity: product.card.rarity ?? undefined,
    cardKingdomUri: product.card.cardKingdomUri ?? undefined,
    usdPrice: product.card.usdPrice ?? undefined,
    usdFoilPrice: product.card.usdFoilPrice ?? undefined,
    price: product.price.toString(),
    stock: product.stock,
  };
}

export function toUIAccessoryDisplay(product: StoreProduct) {
  if (!product.accessory) throw new Error("Missing accessory data");

  return {
    id: product.accessory.id,
    name: product.accessory.name,
    images: product.accessory.imageUrl ? [product.accessory.imageUrl] : [],
    price: product.price.toString(),
    stock: product.stock,
    brand: product.accessory.brand ?? undefined,
    category: product.accessory.category,
    description: product.accessory.description ?? undefined,
    rating: product.rating.toString(),
    numReviews: product.numReviews,
  };
}


export function toCardItem(product: Extract<UIStoreProduct, {type: "CARD"}>): CardItem {
  if (!product.card) throw new Error("Missing card");
  return {
    id: product.card.id,
    name: product.card.name,
    setCode: product.card.setCode,
    setName: product.card.setName,
    manaCost: product.card.manaCost ?? undefined,
    collectorNum: product.card.collectorNum,
    oracleText: product.card.oracleText ?? undefined,
    colorIdentity: product.card.colorIdentity,
    imageUrl: product.card.imageUrl,
    rarity: product.card.rarity ?? undefined,
    type: product.card.type ?? undefined,
    cardKingdomUri: product.card.cardKingdomUri ?? undefined,
    usdPrice: product.card.usdPrice ?? undefined,
    usdFoilPrice: product.card.usdFoilPrice ?? undefined,
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
