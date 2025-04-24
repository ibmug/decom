'use server'; //server action
import { cookies } from "next/headers";

import { CartItem } from "@/types";
import { convertToPlainObject, formatError, roundtwo } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema, /*insertProductSchema*/ } from "../validators";
//import AddToCart from "@/components/shared/product/add-to-cart";
import { revalidatePath } from "next/cache";
//import { Prisma } from "@prisma/client";


//Calculate cart price
const calcPrice = (items: CartItem[])=>{
    const itemsPrice = roundtwo(
        items.reduce((acc, item) => acc + Number(item.price) * item.qty,0)
    ),
    shippingPrice = roundtwo(itemsPrice>100 ? 0 : 10),
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
            

            //Revalidate path
            revalidatePath(`/product/${product.slug}`);
            return {success: true, message: `${product.name} Added to Cart.`};
        } else {

            //Check if item exists is already in the cart, if it is, add qty
            const existItem = (cart.items as CartItem[]).find((x)=>x.productId === item.productId)
            if(existItem){
                //Check stock
                if(product.stock < existItem.qty) {throw new Error ('Not enough stock!');}
                //Increase Qty if available
                (cart.items as CartItem[]).find((x)=> x.productId === item.productId)!.qty = existItem.qty + 1;
            } else {
                //if it doesnt exist in cart
                //lets check stock
                if(product.stock < 1) {throw new Error ('Not enough stock!');}

                //add item to cart
                cart.items.push(item);

            }

            //push to db
            await prisma.cart.update({
                where:{id:cart.id},
                data:{
                    //items: cart.items as Prisma.CartUpdateitemsInput[],
                    items: cart.items,
                    ...calcPrice(cart.items as CartItem[])
                } 
            });

            revalidatePath(`/product/${product.slug}`);
            return {success: true, message: `${product.name} ${existItem ? 'updated in' : 'added to'} to cart`};
        }

       
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
        totalPrice: cart.totalPrice.toString()
    });
}


export async function removeItemFromCart(productId:string){
    try{

        const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if(!sessionCartId) throw new Error('Session Cart Id Not Found');

        //Get Product
        const product = await prisma.product.findFirst({
            where:{id: productId}
        })
        if (!product) {throw new Error ('Product not found')}
        
        //Get user cart
        const cart = await getMyCart();

        if(!cart){throw new Error ('Could not find cart')}
        
        //is the item in the cart?
        const itemincart = (cart.items as CartItem[]).find((x)=>x.productId === productId)
        if(!itemincart){throw new Error ('Product not in cart')}
        
        //Lets check qty
        if(itemincart.qty === 1){
            //if only one, remove it.
            cart.items = (cart.items as CartItem[]).filter((x)=>x.productId !== itemincart.productId)
        } else {
            //Reduce qty
            (cart.items as CartItem[]).find((x)=>x.productId === productId)!.qty = itemincart.qty -1;
        }

        //update cart
        await prisma.cart.update({
            where: {id: cart.id},
            data:{
                //items: cart.items as Prisma.CartUpdateitemsInput[],
                items:cart.items,
                ...calcPrice(cart.items as CartItem[])     
            }
        })

        revalidatePath(`/product/${product.slug}`);
        return {success: true, message: `${product.name} was removed from the cart`};

    }catch(err){
        return {success:false, message: formatError(err)}
    }
}