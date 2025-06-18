import { CartItemWithProductAndInventory, TransformedCart } from "@/types";
import { roundtwo } from "@/lib/utils/utils"; // <--- import roundtwo



export function toTransformedCart(cart: {
  id: string;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessionCartId: string;
  items: CartItemWithProductAndInventory[];
}): TransformedCart {
  return {
    id: cart.id,
    userId: cart.userId ?? undefined,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    sessionCartId: cart.sessionCartId,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      storeProduct: {
        id: item.storeProduct.id,
        slug: item.storeProduct.slug,
        type: item.storeProduct.type,
        images: item.storeProduct.images,
        price: item.storeProduct.price.toString(),  // always string here
        name:
          item.storeProduct.type === "CARD"
            ? item.storeProduct.cardMetadata?.name ?? "Unnamed"
            : item.storeProduct.accessory?.name ?? "Unnamed",
      },
      inventory: {
        id: item.inventory.id,
        stock: item.inventory.stock,
        language: item.inventory.language ?? "English",
        condition: item.inventory.condition ?? "NM",
      },
    })),
  };
}
// --- calcPrice ---

export function calcPrice(items: { price: string; qty: number }[]) {
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

// --- serializeCart ---

export function serializeCart(record: TransformedCart & {
  itemsPrice: string;
  shippingPrice: string;
  taxPrice: string;
  totalPrice: string;
}) {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    userId: record.userId ?? undefined,
    sessionCartId: record.sessionCartId,
    items: record.items.map((item) => {
      const name =
  item.storeProduct.type === "CARD"
    ? item.storeProduct.cardMetadata?.name ?? "Unnamed"
    : item.storeProduct.accessory?.name ?? "Unnamed";

      const image = item.storeProduct.images?.[0] ?? "/images/cardPlaceholder.png";

      return {
        id: item.id,
        productId: item.productId,
        inventoryId: item.inventoryId,
        type: item.storeProduct.type,
        name,
        slug: item.storeProduct.slug,
        price: item.storeProduct.price,
        qty: item.quantity,
        stock: item.inventory.stock,
        language: item.inventory.language ?? "English",
        condition: item.inventory.condition ?? "NM",
        image,
      };
    }),
    itemsPrice: record.itemsPrice,
    shippingPrice: record.shippingPrice,
    taxPrice: record.taxPrice,
    totalPrice: record.totalPrice,
  };
}
