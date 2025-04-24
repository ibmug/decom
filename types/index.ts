import { z } from "zod";
import { insertProductSchema,insertCartSchema,cartItemSchema, shippingAddressSchema } from "@/lib/validators";


// This reflects the shape after Prisma → JSON.stringify → frontend
export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: string | Date;
};


//Cart Type

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>


