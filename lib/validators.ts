import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";

//The following regex after (value)=> /^\d+(\.\d{2})?$ means 
//^ start with, \d = digit, + means 1 or more, in this case, digits.
//The parenthesis means(the ? means optional) which means should contain up to two digits AFTER the dot('.') .(\.\d{2})
const currency = z.string().refine((value)=> /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),'Price must have exactly two decimal places')
//Schema for products.
export const baseProductSchema = z.object({
    id: z.string().optional(),
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

// For creation, drop id entirely
export const insertProductSchema = baseProductSchema.omit({ id: true })

// For updating, require id
export const updateProductSchema = baseProductSchema.extend({
  id: z.string().min(1, 'id is required'),
})

//Schema for signing users in
export const signInFormSchema = z.object({
    email: z.string().email('Invalid Email Address'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const signUpFormSchema = z.object({
    name: z.string().min(3,'Name must be at least 3 characters'),
    email: z.string().email('Invalid Email Address'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    //If it's true it'll pass(password=confirmPassword, if it doesnt it messages and shows the path where it failed)
}).refine((data)=>data.password == data.confirmPassword, {
    message:"Passwords don't match",
    path:['confirmPassword'],
 });



 //Cart schemas

 export const cartItemSchema = z.object({
    productId: z.string().min(1,'Product is required.'),
    name: z.string().min(1,'Name is required.'),
    slug: z.string().min(1,'slug is required.'),
    qty: z.number().int().nonnegative('Quantity is required to be postive'),
    image: z.string().min(1,'Image is required'),
    price: currency,

 });

 export const insertCartSchema = z.object({
    items: z.array(cartItemSchema),
    itemsPrice: currency,
    totalPrice: currency,
    shippingPrice: currency,
    taxPrice: currency,
    sessionCartId: z.string().min(1,'Session cart id is required'),
    userId: z.string().optional().nullable(),
 });




 export const shippingAddressSchema = z.discriminatedUnion('shippingMethod', [
  // DELIVERY
  z.object({
    shippingMethod: z.literal('DELIVERY'),
    address: z.object({
      fullName:   z.string().min(1, 'Full Name is required'),
      country:    z.string().min(1, 'Country is required'),
      streetName: z.string().min(1, 'Street name is required'),
      city:       z.string().min(1, 'City is required'),
      state:      z.string().min(1, 'State is required'),
      postalCode: z.string().min(1, 'Postal code is required'),
      phone:      z.string().optional(),
    }),
    storeId:        z.string().optional(),
    storeName:      z.string().optional(),
    storeAddress:   z.string().optional(),
  }),

  // PICKUP branch (change here)
  z.object({
    shippingMethod: z.literal('PICKUP'),
    storeId:        z.string().min(1, 'Store is required'),
    storeName:      z.string().min(1),
    storeAddress:   z.string().min(1),

    // allow address to be present without error
    address:        z.object({
                      fullName:   z.string(),
                      country:    z.string(),
                      streetName: z.string(),
                      city:       z.string(),
                      state:      z.string(),
                      postalCode: z.string(),
                      phone:      z.string().optional(),
                    }).optional(),
  }),
]);

//schema for payment methods.
export const paymentMethodSchema = z.object({
  type:z.string().min(1, 'Payment method is required')
}).refine((data)=> PAYMENT_METHODS.includes(data.type),{
  path:['type'],
  message:'Invalid Payment Method',
});

//schema for inserting order
export const insertOrderSchema = z.object({
  userId: z.string().min(1,'User is required'),
  itemsPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data)=>PAYMENT_METHODS.includes(data), {message: 'Invalid payment method'}), //should be one of the paymentmethods WE define.
  shippingAddress: shippingAddressSchema
});

export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: currency,
  qty: z.number(),
})

//schema to help us validate payment

export const paymentResultSchema = z.object({
  id:z.string(),
  status:z.string(),
  email_address:z.string(),
  pricePaid:z.string()
})

//Schema for updating the user profile

export const updateProfileSchema = z.object({
  name: z.string().min(3,'Name bust be at least 3 chars long'),
  email: z.string().min(3,'Email must be at least 3 characters long.')
})

