import { z } from "zod";
import { insertProductSchema } from "@/lib/validators";

// This reflects the shape after Prisma → JSON.stringify → frontend
export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  createdAt: string;
};
