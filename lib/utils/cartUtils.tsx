// utils/cartUtils.ts
import { Prisma } from "@prisma/client"
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


export function serializeCart(record: {
  id: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessionCartId: string;
  items?: {
    id: string;
    storeProductId: string;
    quantity: number;
    storeProduct: {
      id: string;
      slug?: string | null;
      price: number | string | Prisma.Decimal;
      stock: number;
      type: 'CARD' | 'ACCESSORY';
      customName?: string | null;
      cardMetadata?: {
        name: string;
        slug?: string;
        imageUrl?: string;
        backsideImageUrl?: string | null; 
      } | null;
      accessory?: {
        name: string;
        slug?: string;
        images: string[];
      } | null;
    };
  }[];
  itemsPrice: number | string | Prisma.Decimal;
  shippingPrice: number | string | Prisma.Decimal;
  taxPrice: number | string | Prisma.Decimal;
  totalPrice: number | string | Prisma.Decimal;
}) {
  return {
    id: record.id,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    userId: record.userId ?? undefined,
    sessionCartId: record.sessionCartId,
    items: record.items?.map((item) => {
      const product = item.storeProduct;
      const isCard = product.type === 'CARD';
      const metadata = product.cardMetadata;
      const accessory = product.accessory;

      const name =
        product.customName ??
        (isCard ? metadata?.name : accessory?.name) ??
        'Unnamed';

      const image =
        isCard
          ? metadata?.imageUrl ?? '/images/cardPlaceholder.png'
          : accessory?.images?.[0] ?? '/images/cardPlaceholder.png';

      const backsideImage =
  isCard && metadata?.backsideImageUrl != null
    ? metadata.backsideImageUrl
    : undefined;


      const quantityRequested = item.quantity;
      const availableQty = product.stock;

      return {
        id: item.id,
        storeProductId: item.storeProductId,
        type: product.type,
        name,
        slug: product.slug ?? 'unknown-slug',
        price: safeDecimalToString(product.price),
        image,
        backsideImage, 
        qty: quantityRequested,
        stock: availableQty,
        stockAvailable: availableQty >= quantityRequested,
        availableQty,
      };
    }) ?? [],
    itemsPrice: record.itemsPrice.toString(),
    shippingPrice: record.shippingPrice.toString(),
    taxPrice: record.taxPrice.toString(),
    totalPrice: record.totalPrice.toString(),
  };
}



function safeDecimalToString(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return value.toString();
  if (value && typeof value === 'object' && 'toString' in value)
    return (value as { toString(): string }).toString();
  return '';
}