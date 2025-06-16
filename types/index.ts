import { z } from "zod";
import {
  shippingAddressSchema,
  insertOrderItemSchema,
  paymentResultSchema,
} from "@/lib/validators";
import { AccessoryProduct, CardMetadata, OrderStatus, Inventory, StoreProduct, Prisma } from "@prisma/client";

// --- SHIPPING ---
export type ShippingMethod = 'DELIVERY' | 'PICKUP';
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// --- INVENTORY ---
export type UIInventory = {
  id: string;
  price: string;
  stock: number;
  language?: string;
  condition?: string;
};

// --- STORE PRODUCT (now fully aligned with schema) ---
export type UIStoreProduct =
  | {
      id: string;
      slug: string;
      type: "CARD";
      cardMetadata: Omit<CardMetadata, 'imageUrl' | 'backsideImageUrl'>;
      inventory: UIInventory[];
      rating?: number;
      numReviews?: number;
      images: string[];
    }
  | {
      id: string;
      slug: string;
      type: "ACCESSORY";
      accessory: Omit<AccessoryProduct, 'images'>;
      inventory: UIInventory[];
      rating?: number;
      numReviews?: number;
      images: string[];
      brand?: string;
      category?: string;
      description?: string;
    };

// --- UICatalogProduct (flattened product for client display) ---
export type UICatalogProduct =
  | {
      id: string;
      slug: string;
      type: "CARD";
      name: string;
      setCode: string;
      setName: string;
      collectorNum: string;
      oracleText?: string;
      colorIdentity: string[];
      images: string[];
      price: string;
      stock: number;
      rating: number;
      numReviews: number;
      inventory: UIInventory[];
    }
  | {
      id: string;
      slug: string;
      name: string;
      type: "ACCESSORY";
      accessory: Omit<AccessoryProduct, 'images'>;
      inventory: UIInventory[];
      rating: number;
      numReviews: number;
      images: string[];
      description?: string;
      category?: string;
      brand?: string;
      price: string;
      stock: number;
    };

// --- CARD DISPLAY ITEM ---
export interface CardItem {
  id: string;
  productId: string;
  name: string;
  setCode: string;
  setName: string;
  manaCost?: string;
  collectorNum: string;
  oracleText?: string;
  colorIdentity: string[];
  imageUrl: string;
  backsideImageUrl?: string | null;
  rarity?: string;
  type?: string;
  usdPrice?: number;
  usdFoilPrice?: number;
  slug: string;
  price: string;
  stock: number;
  rating?: number;
  numReviews?: number;
  inventory: UIInventory[];
}

// --- CART TYPES ---
export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  inventoryId: string;
  quantity: number;
  addedAt: Date;
  storeProduct: StoreProduct;
  inventory: Inventory;
};

export type NewCart = {
  id: string;
  sessionCartId: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
};

export interface UICartItem {
  id: string;
  productId: string;
  inventoryId: string;
  name: string;
  slug: string;
  price: string;
  image: string;
  qty: number;
  stock: number;
  type: 'CARD' | 'ACCESSORY';
  language?: string;
  condition?: string;
}

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

export type AddToCartInput = {
  productId: string;
  inventoryId: string;
  name: string;
  slug: string;
  price: string;
  qty: number;
  image: string;
};

// --- ORDERS ---
export type OrderItem = z.infer<typeof insertOrderItemSchema>;

export type Order = {
  id: string;
  userId: string;
  shippingMethod: 'DELIVERY' | 'PICKUP';
  shippingAddress: ShippingAddress;
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

export type UIOrderItem = {
  name: string;
  slug: string;
  price: string;
  image: string;
  productId: string;
  inventoryId: string;
  qty: number;
  language?: string;
  condition?: string;
};

export type PaymentResult = z.infer<typeof paymentResultSchema>;

// --- USERS ---
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
};

// --- ROUTE PARAMS ---
export interface PageProps<Params = {}, Search = {}> {
  params: Params;
  searchParams?: Search;
}

export type SlugParam = { slug: string };
export type IdParam = { id: string };

// --- PRODUCT UPDATE INPUT (for backend) ---
export type ProductType = "CARD" | "ACCESSORY";

export interface UpdateProductInput {
  id: string;
  slug: string;
  type: ProductType;
  cardMetadataId?: string | null;
  accessoryId?: string | null;
  storeId?: string | null;
  rating?: number;
  numReviews?: number;
  images?: string[];
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
}

// --- UI Order List (Admin Dashboard) ---
export interface UIOrderListItem {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  totalPrice: string;
  itemCount: number;
}

// --- API Response pattern ---
export type ApiResponse<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string };
