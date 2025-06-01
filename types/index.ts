import { StringValidation, z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  paymentResultSchema,
} from "@/lib/validators";
import { AccessoryProduct, CardMetadata, OrderStatus } from "@prisma/client";

// --- PRODUCT ---
export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: Date;
  isFeatured: boolean;
  banner: string | null;
};

// --- SHIPPING ---
export type ShippingMethod = 'DELIVERY' | 'PICKUP';
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// --- STORE PRODUCT ---
export type StoreProduct =
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName?: string | null;
      type: 'CARD';
      cardId: string;
      card: CardMetadata;
      accessory?: null;
    }
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName?: string | null;
      type: 'ACCESSORY';
      accessoryId: string;
      accessory: AccessoryMetadata;
      card?: null;
    };

// --- CART TYPES ---
export type RawCart = z.infer<typeof insertCartSchema>; // Schema inferred from DB insertCartSchema

export type CartItem = {
  id: string;
  quantity: number;
  addedAt: Date;
  storeProduct: StoreProduct;
};

export type NewCart = {
  id: string;
  sessionCartId: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
};



// --- ORDER TYPES ---
export type OrderItem = z.infer<typeof insertOrderItemSchema>;

export type Order = z.infer<typeof insertOrderSchema> & {
    id: string;
  createdAt: Date;
  
  paidAt: Date | null;
  
  deliveredAt: Date | null;
  status: OrderStatus;
  orderItems: OrderItem[];
  user: { name: string; email: string };
};

export type PaymentResult = z.infer<typeof paymentResultSchema>;

// --- CARD ITEM FOR DISPLAY ---
export interface CardItem {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  manaCost?: string;
  collectorNum: string;
  oracleText?: string;
  colorIdentity: string[];
  imageUrl: string;
  rarity?: string;
  type?: string;
  cardKingdomUri?: string;
  usdPrice?: number;
  usdFoilPrice?: number;
  stock: number;
  slug: string;
  price: string;
}

export type UIOrderItem = {
  name: string;
  slug: string;
  price: string;
  image: string;
  productId: string;
  qty: number;
};

export type AddToCartInput = {
  productId: string;
  name: string;
  slug: string;
  price: string;
  qty: number;
  image: string;
};

// types/cart.ts

/** One row in the UI cart table */
export interface UICartItem {
  id: string;
  name:      string
  slug:      string
  price:     string  // already formatted, e.g. "12.34"
  image:     string
  productId: string
  qty:       number
}

/** The full cart payload your React components consume */
export interface UICart {
  id: string
  /** Formatted subtotal of all items */
  itemsPrice:    string

  /** Formatted shipping charge */
  shippingPrice: string

  /** Formatted tax amount */
  taxPrice:      string

  /** Formatted grand total */
  totalPrice:    string

  /** Array of items (now strongly typed) */
  items:         UICartItem[]

  /** Guest or session‐based cart ID */
  sessionCartId: string

  /** Optional logged‐in user ID */
  userId?:       string
}

export type OrderShippingAddress = {
  address: ShippingAddress;
  addressName?: string;
};

export interface UIProduct {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  price: string;
  rating: string;
  numReviews: number;
  stock: number;
  images: string[];
  brand: string;
  category: string;
}


export type UIStoreProduct =
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName: string | null;
      type: "CARD";
      card: CardMetadata;
    }
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName: string | null;
      type: "ACCESSORY";
      accessory: AccessoryProduct;
    };