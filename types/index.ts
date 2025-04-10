import { z } from "zod";
import { insertProductSchema,insertCartSchema,cartItemSchema } from "@/lib/validators";


// This reflects the shape after Prisma → JSON.stringify → frontend
export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  createdAt: string;
};


//Cart Type

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;



