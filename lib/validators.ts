import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

//The following regex after (value)=> /^\d+(\.\d{2})?$ means 
//^ start with, \d = digit, + means 1 or more, in this case, digits.
//The parenthesis means(the ? means optional) which means should contain up to two digits AFTER the dot('.') .(\.\d{2})
const currency = z.string().refine((value)=> /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),'Price must have exactly two decimal places')
//Schema for products.
export const insertProductSchema = z.object({
    name: z.string().min(3,'Name must be at least 3 chars long'),
    slug: z.string().min(3,'Slug must be at least 3 chars long'),
    category: z.string().min(3,'Category must be at least 3 chars long'),
    brand: z.string().min(3,'Brand must be at least 3 chars long'),
    description: z.string().min(3,'Description must be at least 3 chars long'),
    stock: z.coerce.number(),
    images: z.array(z.string()).min(1,'Product must have at least one image'),
    isFeatured: z.boolean(),
    banner: z.string().nullable(),
    price: currency,
})


//Schema for signing users in
export const signInFormSchema = z.object({
    email: z.string().email('Invalid Email Address'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});