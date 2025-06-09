import {  z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  
  shippingAddressSchema,
  insertOrderItemSchema,
  
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
      cardMetadata: CardMetadata;
      accessory?: null;
      rating?: number;
      numReviews?: number;
    }
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName?: string | null;
      type: 'ACCESSORY';
      accessoryId: string;
      accessory: AccessoryProduct;
      card?: null;
      numReviews?: number;
      rating?: number;
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

export type Order = {
  id: string;
  userId: string;
  shippingMethod: 'DELIVERY' | 'PICKUP';
  shippingAddress: ShippingAddress; // or use a specific shape
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  createdAt: Date;
  paidAt: Date | null;
  deliveredAt: Date | null;
  status: OrderStatus;
  orderItems: OrderItem[];
  user: { name: string; email: string };
};

export type UIOrder = Omit<Order, 'createdAt' | 'paidAt' | 'deliveredAt' | 'itemsPrice' | 'taxPrice' | 'totalPrice' | 'shippingPrice'> & {
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  itemsPrice: string;
  shippingPrice: string;
  taxPrice: string;
  totalPrice: string;
};

export type PaymentResult = z.infer<typeof paymentResultSchema>;

// --- CARD ITEM FOR DISPLAY ---
export interface CardItem {
  id: string;
  storeProductId: string;
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
  rating?: number;
  numReviews?: number;
}

export type UIOrderItem = {
  name: string;
  slug: string;
  price: string;
  image: string;
  storeProductId: string;
  qty: number;
};

export type AddToCartInput = {
  storeProductId: string;
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
  storeProductId: string; 
  name: string;
  slug: string;
  price: string;
  image: string;
  qty: number;
  stock: number;
}

/** The full cart payload your React components consume */
export interface UICart {
  id: string;
  userId?: string;
  sessionCartId: string;
  items: UICartItem[];
  itemsPrice: string;
  shippingPrice: string;
  taxPrice: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string | null;
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
  rating: number;
  numReviews: number;
  stock: number;
  images: string[];
  brand: string;
  category: string;
}


// export type UIStoreProduct =
//   | {
//       id: string;
//       slug: string;
//       price: string;
//       stock: number;
//       customName: string | null;
//       type: "CARD";
//       cardMetadata: CardMetadata;
//     }
//   | {
//       id: string;
//       slug: string;
//       price: string;
//       stock: number;
//       customName: string | null;
//       name: string;
//       type: "ACCESSORY";
//       accessory: AccessoryProduct;
//       rating?: number;
//       numReviews: number;
//       images: string[]
//       brand? : string;
//       category?: string;
//       description?: string;
//     };

export type UIStoreProduct =
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName: string | null;
      type: "CARD";
      cardMetadata: CardMetadata;
      rating?: number;           
      numReviews?: number;       
    }
  | {
      id: string;
      slug: string;
      price: string;
      stock: number;
      customName: string | null;
      name: string;
      type: "ACCESSORY";
      accessory: AccessoryProduct;
      rating?: number;
      numReviews?: number;
      images: string[];
      brand?: string;
      category?: string;
      description?: string;
    };


  export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

  
export type AppUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
};
