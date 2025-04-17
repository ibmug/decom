'use server'; //server action
import { cookies } from "next/headers";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError, roundtwo } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema, /*insertProductSchema*/ } from "../validators";
//import AddToCart from "@/components/shared/product/add-to-cart";
import { revalidatePath } from "next/cache";

//Calculate cart price
const calcPrice = (items: CartItem[])=>{
    const itemsPrice = roundtwo(
        items.reduce((acc, item) => acc + Number(item.price) * item.qty,0)
    ),
    shippingPrice = roundtwo(itemsPrice>100 ? 0 : 100),
    taxPrice = roundtwo(0.15 * itemsPrice),
    totalPrice = roundtwo(itemsPrice + taxPrice + shippingPrice);

    return ({
        itemsPrice: itemsPrice?.toFixed(2),
        shippingPrice: shippingPrice?.toFixed(2),
        taxPrice: taxPrice?.toFixed(2),
        totalPrice: totalPrice?.toFixed(2)
    }) ;
}

export async function addItemToCart(data: CartItem){
    
    try{
        //Check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if(!sessionCartId) throw new Error('Session Cart Id Not Found');



        const session = await auth();
        const userId = session?.user?.id ? session.user.id as string : undefined;

        //Get Cart
        const cart = await getMyCart();

        //Lets parse and validate that data.
        const item = cartItemSchema.parse(data);
        const product = await prisma.product.findFirst({
            where: {id: item.productId},
        });

        if(!product) throw new Error('Product Not Found');

        
       
        if(!cart){
            
            try {
                const newCart = insertCartSchema.parse({
                  userId,
                  sessionCartId,
                  items: [item],
                  ...calcPrice([item]),
                });
            
            
                await prisma.cart.create({ data: newCart });
              } catch (err) {
                throw err;
              }
            

        }
        
    

        //Revalidate path
        revalidatePath(`/product/${product.slug}`);


        return {success: true, message: "Item Added to Cart."};
    }catch(err){
        return {success: false, message: formatError(err)}
    }
    
}

export async function getMyCart(){

    
    const sessionCartId = (await cookies()).get('sessionCartId')?.value
    if(!sessionCartId) throw new Error('Session Cart Id Not Found');

    const session = await auth();
    const userId = session?.user?.id ? session.user.id as string : undefined;

    //Get User Cart from DB.
    const cart = await prisma.cart.findFirst({
        where: userId ? {userId:userId} : {sessionCartId:sessionCartId}
    });
    

    if (!cart) return undefined;

    return convertToPlainObject({
        ...cart,
        items: cart.items as CartItem[],
        itemsPrice: cart.itemsPrice.toString(),
        shippingPrice: cart.shippingPrice.toString(),
        taxPrice: cart.taxPrice.toString(),
    });
}