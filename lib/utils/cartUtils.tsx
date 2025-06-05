// utils/cartUtils.ts
import { roundtwo } from "./utils"

export interface PriceCalcItem {
  price: string
  qty:   number
}

export function calcPrice(items: PriceCalcItem[]) {
  const itemsValue    = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)
  const itemsPrice    = roundtwo(itemsValue)
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10)
  const taxPrice      = roundtwo(0.15 * itemsPrice)
  const totalPrice    = roundtwo(itemsPrice + shippingPrice + taxPrice)

  return {
    itemsPrice:    itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice:      taxPrice.toFixed(2),
    totalPrice:    totalPrice.toFixed(2),
  }
}


// lib/utils/cart-serializer.ts
export function serializeCart(record: {
  id: string;
  userId?: string | null;
  sessionCartId: string;
  items?: {
    id: string;
    storeProductId: string;
    quantity: number;
    storeProduct: {
      id: string;
      slug?: string | null;
      price: number | string;
      stock: number;
      type: 'CARD' | 'ACCESSORY';
      customName?: string | null;
      cardMetadata?: {
        name: string;
        slug: string;
        imageUrl?: string;
      } | null;
      accessory?: {
        name: string;
        slug: string;
        images: string[];
      } | null;
    };
  }[];
  itemsPrice: number | string;
  shippingPrice: number | string;
  taxPrice: number | string;
  totalPrice: number | string;
}) {
  return {
    id: record.id,
    userId: record.userId ?? undefined,
    sessionCartId: record.sessionCartId,
    items: record.items?.map((item) => {
      const product = item.storeProduct;
      const isCard = product.type === 'CARD';
      const metadata = product.cardMetadata;
      const accessory = product.accessory;

      return {
        id: item.id,
        productId: item.storeProductId,
        name:
          product.customName ??
          (isCard ? metadata?.name : accessory?.name) ??
          'Unnamed',
        slug:
          product.slug ??
          (isCard ? metadata?.slug : accessory?.slug) ??
          'unknown-slug',
        price: product.price.toString(),
        image:
          (isCard
            ? metadata?.imageUrl
            : accessory?.images?.[0]) ?? '/images/cardPlaceholder.png',
        qty: item.quantity,
        stock: product.stock,
      };
    }) ?? [],
    itemsPrice: record.itemsPrice.toString(),
    shippingPrice: record.shippingPrice.toString(),
    taxPrice: record.taxPrice.toString(),
    totalPrice: record.totalPrice.toString(),
  };
}
