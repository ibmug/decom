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
import { PaymentResult } from "@/types";
import { paypalUtils } from "../paypalUtils";
import { revalidatePath } from "next/cache";


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


//create a new paypalorder
export async function createPayPalOrder(orderId: string){
    try{
        //get order from db
        const order = await prisma.order.findFirst({
            where:{id:orderId},
        });

        if(order){
            //create paypal order
            const paypalOrder = await paypalUtils.createOrder(Number(order.totalPrice));
            //Update local order with paypals order id.
            await prisma.order.update({
                where:{id:orderId},
                data:{
                    paymentResult:{
                        id:paypalOrder.id,
                        email_adress:'',
                        status:'',
                        price:0
                    }
                }
            });

            return {success:true, message:'Paypal order created', data:paypalOrder.id};

        }else{
            throw new Error('Order not found');
        }
    }catch(err){
        return {success:false, message:formatError(err)}
    }
}


//Approve paypal order and update order to paid
export async function approvePayPalOrder(orderId:string, data: {orderID: string}) {
    try{
     const order = await prisma.order.findFirst({
        where: {id:orderId},
     });
     if(!order) throw new Error('Order not found');

     const captureData = await paypalUtils.capturePayment(data.orderID);
     //Matching id that we got in ppal toi the one in our paymentResult, if they don't match then we just error
     if(!captureData || captureData.id !== (order.paymentResult as PaymentResult)?.id || captureData.status !== 'COMPLETED'){
        throw new ErrorEvent('Error in Paypal payment');
     }
     //Update the order to paid
     await updateOrderPaid({
        orderId,
        paymentResult:{
            id:captureData.id,
            status:captureData.status,
            email_address:captureData.payer.email_address,
            //pricePaid may change in the future if paypal changes.
            pricePaid:captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        }
     });

     revalidatePath(`/order/${orderId}`);
     return{
        success:true,
        message:'Your order has been paid.'
     }

    }catch(err){
        return{success:false, message:formatError(err)}
    }

}


async function updateOrderPaid({orderId,paymentResult}: {orderId: string; paymentResult?: PaymentResult}){

    //get order
    const order = await prisma.order.findFirst({
        where:{
            id: orderId,
        },
        include:{
            orderItems:true
        }
    });
    if(!order) throw new Error('Order Not Found');

    if(order.isPaid) throw new Error('Order is already paid');

    //Transaction to update order and account for product stock.
    await prisma.$transaction(async (tx)=>{
        //iterate over the products and update the stock.
        for(const item of order.orderItems){
            await tx.product.update({
                where:{id: item.productId},
                data: {stock: {increment: -item.qty}},
            });
        }

        //Set order to paid.
        await tx.order.update({
            where:{id:orderId},
            data:{isPaid: true,
            paidAt:new Date(),
            paymentResult},
        });
        
    })
        ///Get updated order after transaction
        const updateOrder = await prisma.order.findFirst({
        where:{id: orderId},
        include:{
            orderItems: true,
            user: {select:{
                name:true,
                email:true
            },},
        }
        });

        if(!updateOrder) throw new Error('Order was not found!')

    }