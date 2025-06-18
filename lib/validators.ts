import { z } from "zod";
import { PAYMENT_METHODS } from "./constants";
import { formatNumberWithDecimal } from "./utils/utils";

// --- Currency validator ---
const currency = z.string().refine(
  (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
  "Price must have exactly two decimal places"
);

// --- Inventory validator ---
const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  stock: z.number().int().nonnegative(),
  language: z.string().optional(),
  condition: z.string().optional(),
});

// --- Shared base product fields ---
const baseProductSchema = z.object({
  slug: z.string().min(3),
  storeId: z.string().uuid().optional().nullable(),
  rating: z.number().optional(),
  numReviews: z.number().optional(),
  images: z.array(z.string().url()).min(1),
  inventory: z.array(inventoryItemSchema),
  price: currency,
});

// --- CARD schema ---
const cardSchema = baseProductSchema.extend({
  type: z.literal("CARD"),
  cardMetadataId: z.string().uuid(),
});

// --- ACCESSORY schema ---
const accessorySchema = baseProductSchema.extend({
  type: z.literal("ACCESSORY"),
  accessoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().min(1),
});

// --- INSERT product schema ---
export const insertProductSchema = z.discriminatedUnion("type", [
  cardSchema,
  accessorySchema,
]);

// --- UPDATE product schema (✅ correctly handled discriminated union) ---
export const updateProductSchema = z.discriminatedUnion("type", [
  cardSchema.extend({ id: z.string().uuid() }),
  accessorySchema.extend({ id: z.string().uuid() }),
]);

// --- Shipping address ---
export const shippingAddressSchema = z.object({
  shippingMethod: z.enum(["DELIVERY", "PICKUP"]),
  address: z.object({
    fullName: z.string().min(1),
    country: z.string().min(1),
    streetName: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }),
  addressName: z.string().optional(),
});

// --- Payment method ---
export const paymentMethodSchema = z.object({
  type: z.string().min(1).refine(
    (val) => PAYMENT_METHODS.includes(val),
    { message: "Invalid payment method", path: ["type"] }
  ),
});

// --- Orders ---
export const insertOrderSchema = z.object({
  userId: z.string().uuid(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
  shippingMethod: z.enum(["DELIVERY", "PICKUP"]),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string(),
  shippingPrice: z.number(),
  taxPrice: z.number(),
  itemsPrice: z.number(),
  totalPrice: z.number(),
});

export const insertOrderItemSchema = z.object({
  productId: z.string().uuid(),
  inventoryId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: currency,
  qty: z.number(),
});

// --- Payment result ---
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  pricePaid: z.string(),
});

// --- User profile ---
export const updateProfileSchema = z.object({
  name: z.string().min(3),
  email: z.string().min(3),
});

export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().uuid(),
  role: z.string().min(1),
});

// --- Insert accessory standalone (for admin form) ---
export const insertAccessoryProductSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  price: currency,
  stock: z.number().int().nonnegative(),
  storeId: z.string().uuid().optional(),
});

// --- Sign up form ---
export const signUpFormSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name too long')
    .trim(),

  email: z.string()
    .email('Invalid Email Address')
    .max(100, 'Email too long')
    .transform(val => val.toLowerCase().trim()),

  password: z.string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password too long'),

  confirmPassword: z.string()
    .min(6, 'Password must be at least 6 characters.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
