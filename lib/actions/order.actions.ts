'use server'

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { convertToPlainObject, formatError } from "../utils"
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";
import { getMyCart } from "./cart.actions";
import { getUserById, requireShippingAddress } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem } from "@/types";
import { PrismaClient } from "@prisma/client";

//create order and create the order items

export async function createOrder(){
    try{
        const session = await  getServerSession(authOptions);
        if(!session) throw new Error('User is not authenticated');

        const cart = await getMyCart();
        const userId = session?.user?.id;
        if(!userId) throw new Error ('User not found');
        

        //This would be the cleanest way
        const user = await getUserById(userId);

        //Check if user has items in cart
        if(!cart || cart.items.length === 0 ){
            return {success: false, message:'Your cart is empty', redirectTo:'/'}
        }
         //check user has an address or has selected a store.
       const {shippingMethod} = await requireShippingAddress();

        if(!user.paymentMethod){
            return {success:false, message:'Select a payment method', redirectTo: '/payment-method'}
        }

        //Create order object
        const order = insertOrderSchema.parse({
            userId: user.id,
            shippingAddress: user.address,
            paymentMethod: user.paymentMethod,
            shippingMethod: shippingMethod,
            itemsPrice: cart.itemsPrice,
            taxPrice: cart.taxPrice,
            shippingPrice: cart.shippingPrice,
            totalPrice: cart.totalPrice

        });
        /// create transaction to create oredr and order items in db.

        const insertedOrderId = await prisma.$transaction(async (tx:PrismaClient)=>{
            const insertedOrder = await tx.order.create({data: order})
            //create oorder items from the cart items
            for(const item of cart.items as CartItem[]){
                await tx.orderItem.create(
                    {data:{
                        ...item,
                        price: item.price,
                        orderId: insertedOrder.id
                    },
                });
            }
            //Clear the cart
            await tx.cart.update({
                where: {id: cart.id},
                data:{
                    items:[],
                    totalPrice:0,
                    taxPrice: 0,
                    shippingPrice:0,
                    itemsPrice:0,
                }
            })
        return insertedOrder.id
        });

        if(!insertedOrderId){ throw new Error('Order Not created')}

        return{success:true, message:'Order Created.', redirectTo:`/order/${insertedOrderId}` }

    }catch(err){
        if(isRedirectError(err)){ throw err};
        return {success: false, message: formatError(err)}
    }
}


//get order by id
export async function getorderById(orderId: string){
    const data = await prisma.order.findFirst({
        where:{id: orderId},
        include: {
            orderItems: true,
            user: { select: {name: true, email: true}},
        },
    })

    return convertToPlainObject(data);
}