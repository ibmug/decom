import { z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  paymentResultSchema,
} from "@/lib/validators";

// Product type (infer + additional fields)
export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: string | Date;

  isFeatured: boolean
  banner: string | null
};

// Shipping method enum
export type ShippingMethod = 'DELIVERY' | 'PICKUP';

// Shipping address shapes
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Cart types
export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = {
  id: string;
  quantity: number;
  addedAt: string | Date;

  storeProduct: {
    id: string;
    slug: string;
    price: string;
    stock: number;
    customName?: string | null;
    type: 'CARD' | 'ACCESSORY';

    card?: {
      id: string;
      name: string;
      imageUrl: string;
      setName: string;
      manaCost?: string | null;
    } | null;

    accessory?: {
      id: string;
      name: string;
      imageUrl?: string | null;
    } | null;
  };
};

export type NewCart = {
  id: string;
  sessionCartId: string;
  userId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: CartItem[];
};


export type StoreProduct = {
  id: string;
  slug: string;
  price: string;
  stock: number;
  customName?: string | null;
  type: 'CARD' | 'ACCESSORY';
  card?: { id: string; name: string; imageUrl: string; setName: string; manaCost?: string | null } | null;
  accessory?: { id: string; name: string; imageUrl?: string | null } | null;
};



// Order item type
export type OrderItem = z.infer<typeof insertOrderItemSchema>;

// Order type (infer + additional fields)
export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  createdAt: Date;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  orderItems: OrderItem[];
  user: { name: string; email: string };
};


export type PaymentResult = z.infer<typeof paymentResultSchema>

export interface CardItem {
  // From CardMetadata
  id:             string;   // ID from CardMetadata (useful if needed)
  name:           string;
  setCode:        string;
  setName:        string;
  manaCost?:      string;   // now optional, to match schema
  collectorNum:   string;
  oracleText?:    string;
  colorIdentity:  string[];
  imageUrl:       string;
  rarity?:        string;
  type?:          string;
  cardKingdomUri?: string;
  usdPrice?:      number;
  usdFoilPrice?:  number;

  // From storeProduct
  stock:          number;
  slug:           string;
  price:          string; // stringified decimal for client use
}

