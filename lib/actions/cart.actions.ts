'use server'; //server action
import { cookies } from "next/headers";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, /*insertProductSchema*/ } from "../validators";

export async function addItemToCart(data: CartItem){
    
    try{
        //Check for the cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if(!sessionCartId) throw new Error('Session Cart Id Not Found');



        const session = await auth();
        const userId = session?.user?.id ? session.user.id as string : undefined;

        //Get Cart
        //const cart = await getMyCart();
        //Lets parse and validate that data.
        const item = cartItemSchema.parse(data);
        const product = await prisma.product.findFirst({
            where: {id: item.productId},
        });

        console.log({
            'userId': userId,
            'sessionCartId': sessionCartId,
            'itemRequested': item,
            'ProductFound': product,
        });


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