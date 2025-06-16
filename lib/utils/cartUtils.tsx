import { UIInventory } from "@/types";
import { roundtwo } from "./utils";

// --- Pricing helper ---

export interface PriceCalcItem {
  price: string;
  qty: number;
}

export function calcPrice(items: PriceCalcItem[]) {
  const itemsValue = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const itemsPrice = roundtwo(itemsValue);
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10);
  const taxPrice = roundtwo(0.15 * itemsPrice);
  const totalPrice = roundtwo(itemsPrice + shippingPrice + taxPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
}

// --- Cart serializer ---

type TransformedCart = {
  id: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessionCartId: string;
  items?: {
    id: string;
    productId: string;
    inventoryId: string;
    quantity: number;
    storeProduct: {
      id: string;
      slug: string;
      type: "CARD" | "ACCESSORY";
      cardMetadata?: {
        name: string;
      } | null;
      accessory?: {
        name: string;
      } | null;
      images: string[];
    };
    inventory: UIInventory;
  }[];
  itemsPrice: string | number;
  shippingPrice: string | number;
  taxPrice: string | number;
  totalPrice: string | number;
};

export function serializeCart(record: TransformedCart) {
  return {
    id: record.id,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    userId: record.userId ?? undefined,
    sessionCartId: record.sessionCartId,
    items: record.items?.map((item) => {
      const product = item.storeProduct;
      const isCard = product.type === 'CARD';
      const name = isCard
        ? product.cardMetadata?.name ?? 'Unnamed'
        : product.accessory?.name ?? 'Unnamed';

      const image = product.images?.[0] ?? '/images/cardPlaceholder.png';

      return {
        id: item.id,
        productId: item.productId,
        inventoryId: item.inventoryId,
        type: product.type,
        name,
        slug: product.slug,
        price: item.inventory.price,
        qty: item.quantity,
        stock: item.inventory.stock,
        language: item.inventory.language ?? undefined,
        condition: item.inventory.condition ?? undefined,
        image,
      };
    }) ?? [],
    itemsPrice: record.itemsPrice.toString(),
    shippingPrice: record.shippingPrice.toString(),
    taxPrice: record.taxPrice.toString(),
    totalPrice: record.totalPrice.toString(),
  };
}
