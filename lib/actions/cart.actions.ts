'use server';

import { prisma } from "@/db/prisma";
import { cookies } from "next/headers";
import { serializeCart, toTransformedCart } from "../utils/cartUtils";
import { calcPrice } from "../utils/cartUtils";
import { ApiResponse } from "@/types";

// === Session Cart Identifiers ===
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
async function resolveCart(sessionCartId: string) {

  const cart = await prisma.cart.findUnique({
  where: { sessionCartId },
  include: {
    items: {
      include: {
        storeProduct: {
          select: {
            id: true,
            slug: true,
            type: true,
            price: true,
            images: true,
            cardMetadata: { select: { name: true } },
            accessory: { select: { name: true } },
          },
        },
        inventory: {
          select: {
            id: true,
            stock: true,
            language: true,
            condition: true
          }
        },
      },
    },
  },
});

  if (!cart) {
    const newCart = await prisma.cart.create({
  data: { sessionCartId },
  include: {
    items: {
      include: {
        storeProduct: {
          select: {
            id: true,
            slug: true,
            type: true,
            price: true,
            images: true,
            cardMetadata: { select: { name: true } },
            accessory: { select: { name: true } },
          },
        },
        inventory: {
          select: {
            id: true,
            stock: true,
            language: true,
            condition: true
          }
        },
      },
    },
  },
});

    return {
      ...newCart,
      items: newCart.items.filter((i): i is typeof i & { inventory: NonNullable<typeof i.inventory> } => i.inventory !== null),
    };
  }

  // Filter out null inventory
  return {
    ...cart,
    items: cart.items.filter((i): i is typeof i & { inventory: NonNullable<typeof i.inventory> } => i.inventory !== null),
  };
}

// === Add item to cart ===
export async function addItemToCart(data: { productId: string; inventoryId: string; qty?: number }): Promise<ApiResponse> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCart(sessionCartId);

    const inv = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
      select: { id: true, stock: true },
    });
    if (!inv) return { success: false, message: "Inventory not found" };

    const existing = cart.items.find(item => item.productId === data.productId && item.inventory.id === data.inventoryId);
    const qtyToAdd = data.qty ?? 1;
    const totalQty = (existing?.quantity ?? 0) + qtyToAdd;

    if (totalQty > inv.stock) return { success: false, message: "Not enough stock available" };

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: totalQty } });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: data.productId, inventoryId: data.inventoryId, quantity: qtyToAdd },
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
    const found = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!found) return { success: false, message: "Cart item not found" };

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return { success: true, message: "Item removed from cart" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// === Update quantity directly ===
export async function updateCartItemQuantity(data: { productId: string; inventoryId: string; quantity: number }): Promise<ApiResponse> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCart(sessionCartId);

    const existing = cart.items.find(item => 
      item.productId === data.productId && 
      item.inventory.id === data.inventoryId
    );

    // Always recheck inventory!
    const inv = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
      select: { id: true, stock: true },
    });
    if (!inv) return { success: false, message: "Inventory not found" };

    // ---- Handle cases ----

    // 1️⃣ Create new (if doesn't exist & qty > 0 and stock available)
    if (!existing && data.quantity > 0) {
      const qtyToAdd = Math.min(data.quantity, inv.stock);

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          inventoryId: data.inventoryId,
          quantity: qtyToAdd,
        },
      });

      return { success: true, message: "Item added to cart" };
    }

    // 2️⃣ Update existing
    if (existing) {
      if (data.quantity <= 0) {
        // Remove item
        await prisma.cartItem.delete({ where: { id: existing.id } });
        return { success: true, message: "Item removed from cart" };
      }

      if (data.quantity > inv.stock) {
        // Adjust down to stock
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: inv.stock },
        });

        return { 
          success: true, 
          message: `We can't add more, you already have max available in stock! (${inv.stock})` 
        };
      }

      // Normal update (qty within stock)
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: data.quantity },
      });

      return { success: true, message: "Quantity updated" };
    }

    // Should not reach here
    return { success: false, message: "Unexpected cart state" };

  } catch (err) {
    console.error(err);
    return { success: false, message: "An unexpected error occurred" };
  }
}



// === Get my cart (serialized) ===
export async function getMyCart(): Promise<ApiResponse<ReturnType<typeof serializeCart>>> {
  try {
    const { sessionCartId } = await getCartIdentifiers();
    const cart = await resolveCart(sessionCartId);
    //console.log("DEBUG CART ITEMS:", JSON.stringify(cart.items, null, 2));


    const transformed = toTransformedCart({
  id: cart.id,
  userId: cart.userId,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
  sessionCartId: cart.sessionCartId,
  items: cart.items.map(item => ({
    id: item.id,
    productId: item.productId,
    inventoryId: item.inventoryId,
    quantity: item.quantity,
    storeProduct: {
      id: item.storeProduct.id,
      slug: item.storeProduct.slug,
      type: item.storeProduct.type,
      images: item.storeProduct.images,
      price: +item.storeProduct.price,  // Decimal --> number
      cardMetadata: item.storeProduct.cardMetadata,
      accessory: item.storeProduct.accessory,
    },
    inventory: {
      id: item.inventory.id,
      stock: item.inventory.stock,
      language: item.inventory.language ?? "English",  // add this
      condition: item.inventory.condition ?? "NM",     // add this
    },
  })),
});



    // Calculate totals (extensible later)
    const totals = calcPrice(transformed.items.map(i => ({
      price: i.storeProduct.price,
      qty: i.quantity
    })));

    const serialized = serializeCart({ ...transformed, ...totals });
    return { success: true, message: "Cart loaded", data: serialized };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to load cart" };
  }
}
