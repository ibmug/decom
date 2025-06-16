'use server';

import { prisma } from "@/db/prisma";
import { cookies } from "next/headers";
import { serializeCart } from "../utils/cartUtils";
import { transformCartRecord } from "../utils/transformers";

// ✅ GLOBAL API RESPONSE TYPE
export type ApiResponse<T = void> = 
  | { success: true; message: string; data?: T }
  | { success: false; message: string };

// === Get identifiers ===

async function getCartIdentifiers() {
  const cookieStore = await cookies();
  let sessionCartId = cookieStore.get("sessionCartId")?.value;

  if (!sessionCartId) {
    sessionCartId = crypto.randomUUID();
    cookieStore.set("sessionCartId", sessionCartId, { path: "/", httpOnly: true });
  }

  return { sessionCartId };
}

// === Resolve or create cart ===
async function resolveCartFixed(sessionCartId: string) {
  const existing = await prisma.cart.findFirst({
    where: { sessionCartId },
    include: {
      items: {
        include: {
          storeProduct: {
            include: { 
              cardMetadata: true, 
              accessory: true
            }
          },
          inventory: true
        }
      }
    }
  });

  if (existing) return existing;

  return await prisma.cart.create({
    data: { sessionCartId },
    include: {
      items: {
        include: {
          storeProduct: {
            include: { 
              cardMetadata: true, 
              accessory: true
            }
          },
          inventory: true
        }
      }
    }
  });
}

// === Add item to cart ===
export async function addItemToCart(data: { productId: string; inventoryId: string; qty?: number }): Promise<ApiResponse> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCartFixed(sessionCartId);

    const inventory = await prisma.inventory.findUnique({ where: { id: data.inventoryId } });
    if (!inventory) return { success: false, message: "Inventory not found" };

    const existing = cart.items.find(i => i.productId === data.productId && i.inventory?.id === data.inventoryId);
    const requestedQty = data.qty ?? 1;
    const currentQty = existing?.quantity ?? 0;
    const totalQty = currentQty + requestedQty;

    if (inventory.stock < totalQty) return { success: false, message: "Not enough stock available" };

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: totalQty } });
    } else {
      await prisma.cartItem.create({
        data: {
          productId: data.productId,
          inventoryId: data.inventoryId,
          quantity: requestedQty,
          cartId: cart.id
        }
      });
    }

    return { success: true, message: "Item added to cart" };

  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// === Remove item from cart ===
export async function removeItemFromCart(cartItemId: string): Promise<ApiResponse> {
  try {
    const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!cartItem) return { success: false, message: "Cart item not found" };

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return { success: true, message: "Item removed from cart" };

  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// === Update quantity directly ===
export async function updateCartItemQuantity({
  productId,
  inventoryId,
  quantity
}: {
  productId: string;
  inventoryId: string;
  quantity: number;
}): Promise<ApiResponse> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCartFixed(sessionCartId);

    const existingItem = cart.items.find(
      item => item.productId === productId && item.inventory?.id === inventoryId
    );

    if (!existingItem && quantity > 0) {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, inventoryId, quantity },
      });
    } else if (existingItem && quantity > 0) {
      await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity } });
    } else if (existingItem && quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    }

    return { success: true, message: "Quantity updated" };

  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// === Get my cart (serialized + wrapped) ===
export async function getMyCart(): Promise<ApiResponse<ReturnType<typeof serializeCart>>> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCartFixed(sessionCartId);
    const transformedCart = transformCartRecord(cart);
    const serialized = serializeCart(transformedCart);
    return { success: true, message: "Cart loaded", data: serialized };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to load cart" };
  }
}
