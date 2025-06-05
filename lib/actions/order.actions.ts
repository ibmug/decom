'use server'

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { formatError } from "../utils/utils"
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";
import { getMyCart } from "./cart.actions";
import { getUserById, requireShippingAddress } from "./user.actions";
import { insertOrderItemSchema, insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { ShippingAddress,Order, UICartItem, UIOrderItem } from "@/types";
import { PaymentResult } from "@/types";
import { paypalUtils } from "../paypalUtils";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE, STORES } from "../constants";
import { isUuid } from "../utils/utils";
import {Prisma, OrderStatus } from "@prisma/client";


export interface GetOrderOpts {
    query?:    string
    page?:     number
    limit?:    number
    orderBy?:  keyof Order      // e.g. "createdAt", "totalPrice"...
    order?:    "asc" | "desc"

  }



export type OrderWithUser = Prisma.OrderGetPayload<{
    include: { user: { select: { name: true } } }
  }>


//create order and create the order items

export async function createOrder() {
  console.warn('🛒 Creating order...');

  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('User is not authenticated');

    const userId = session.user.id;
    const cart = await getMyCart();
    if (!userId) throw new Error('User ID not found');
    if (!cart) throw new Error('Cart not found');

    if (cart.items.length === 0) {
      return {
        success: false,
        message: 'Your cart is empty',
        redirectTo: '/',
      };
    }

    const user = await getUserById(userId);
    if (!user.paymentMethod) {
      return {
        success: false,
        message: 'Select a payment method',
        redirectTo: '/payment-method',
      };
    }

    const { shippingMethod } = await requireShippingAddress();

    if (shippingMethod === 'DELIVERY' && !user.address) {
      throw new Error('User has no address to deliver to');
    }

    const shippingAddress =
      shippingMethod === 'PICKUP'
        ? {
            address: STORES['Shivan Shop'].address,
            addressName: STORES['Shivan Shop'].addressName,
          }
        : {
            ...user.address,
          };

    const parsedOrder = insertOrderSchema.parse({
      userId: user.id,
      shippingMethod,
      shippingAddress,
      paymentMethod: user.paymentMethod,
      shippingPrice: Number(cart.shippingPrice),
      taxPrice: Number(cart.taxPrice),
      itemsPrice: Number(cart.itemsPrice),
      totalPrice: Number(cart.totalPrice),
    });

    const insertedOrderId = await prisma.$transaction(async (tx) => {
      const insertedOrder = await tx.order.create({
        data: {
          user: { connect: { id: parsedOrder.userId } },
          status: OrderStatus.PENDING,
          shippingMethod: parsedOrder.shippingMethod,
          shippingAddress: parsedOrder.shippingAddress,
          paymentMethod: parsedOrder.paymentMethod,
          shippingPrice: parsedOrder.shippingPrice,
          taxPrice: parsedOrder.taxPrice,
          itemsPrice: parsedOrder.itemsPrice,
          totalPrice: parsedOrder.totalPrice,
        },
      });

      for (const item of cart.items as UICartItem[]) {
        console.log("🧩 Order item data:", item);
        const parsedItem = insertOrderItemSchema.parse({
          storeProductId: item.storeProductId, // ← This must match StoreProduct.id
          slug: item.slug,
          image: item.image,
          name: item.name,
          price: item.price,
          qty: item.qty,
        });

        await tx.orderItem.create({
          data: {
            orderId: insertedOrder.id,
            ...parsedItem,
          },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { items: { deleteMany: {} } },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error('Order not created');

    return {
      success: true,
      message: 'Order created successfully',
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error('❌ Order creation failed:', err);
    return {
      success: false,
      message: formatError(err),
    };
  }
}


//get order by id
export async function getOrderById(
  orderId: string
): Promise<Order | null> {
  const res = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user:       { select: { name: true, email: true } },
      orderItems: {select: {productId: true, name: true, slug: true, image: true, price: true, qty: true},},
    },
  })
  if (!res) return null

  if(!res.user){ throw new Error ("Order has no associated user")}

  // Reconstruct the typed ShippingAddress
  const shippingAddress = res.shippingAddress as ShippingAddress;
  

  // Build and return exactly the shared `Order` shape
  return {
    id:             res.id,
    user:           res.user,
    userId: res.userId,  
    status: res.status,
    shippingMethod: res.shippingMethod,                 // { name, email }
    shippingAddress,
    paymentMethod:  res.paymentMethod,
    itemsPrice:     res.itemsPrice.toNumber(),
    shippingPrice:  res.shippingPrice.toNumber(),
    taxPrice:       res.taxPrice.toNumber(),
    totalPrice:     res.totalPrice.toNumber(),
    paidAt:         res.paidAt,
    deliveredAt:    res.deliveredAt,
    createdAt:      res.createdAt,
    orderItems:     res.orderItems.map((oi) => ({
      productId: oi.productId,
      name:      oi.name!,
      slug:      oi.slug!,
      price:     oi.price.toString(),
      qty:       oi.qty,
      image:     oi.image!,
    })) as UIOrderItem[],
  }
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
export async function approvePayPalOrder(orderId:string, data: {orderId: string}) {
    try{
     const order = await prisma.order.findFirst({
        where: {id:orderId},
     });
     if(!order) throw new Error('Order not found');

     const captureData = await paypalUtils.capturePayment(data.orderId);
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

    if(order.paidAt) throw new Error('Order is already paid');

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
            data:{
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

    //get users orders
    export async function getMyOrders({limit=PAGE_SIZE, page}: {limit?:number; page:number}){
        const session = await await  getServerSession(authOptions);
        if(!session) throw new Error('User is not authorized')

        const data = await prisma.order.findMany({
            where:{userId: session.user.id!},
            orderBy:{ createdAt:'desc'},
            take: limit,
            skip:(page -1 )* limit
        });
        const dataCount = await prisma.order.count({
            where:{userId: session.user.id!}
        });

        return {
            data,
            totalPages:Math.ceil(dataCount / limit)
        }
    }


type SalesDataType = {
    month: string;
    totalSales: number;
}[];
    //Get sales data and order summary
export async function getOrderSummary(){
    //Get counts for each resource
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();

    //Calculate the total sales
    const totalSales = await prisma.order.aggregate({
        _sum: {totalPrice: true}
    });
    //Get Monthly Sales

    const salesDataRaw:{month: string; totalSales: Prisma.Decimal}[] = await prisma.$queryRaw`SELECT to_char("createdAt", 'MM/YYYY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YYYY')`;

    const salesData:SalesDataType = salesDataRaw.map((entry)=>({
        month: entry.month,
        totalSales: Number(entry.totalSales),
    }));


    //Get latest sales
    const latestSales = await prisma.order.findMany({
        orderBy: {createdAt: 'desc'},
        take: 15,

        include: {
            user: {
                select:{name:true}
            },
            orderItems:true
        }
    });

    return {
        ordersCount,
        productsCount,
        usersCount,
        totalSales,
        latestSales,
        salesData,
    }

}

export type GetOrderSummaryReturn = Awaited<ReturnType<typeof getOrderSummary>>



///Get all orders.
export async function getAllOrders ({
    limit = PAGE_SIZE,
    page
}: {
    limit?: number;
    page: number;
}): Promise<{ data: OrderWithUser[]; totalPages: number }>{
    const data = await prisma.order.findMany({
        orderBy: {createdAt: 'desc'},
        take: limit,
        skip:  (page -1 ) * limit,
        include: {user: {select: {name: true}}},
    })

    const dataCount = await prisma.order.count();

    return {
        data,
        totalPages: Math.ceil(dataCount / limit),
    };
}

//get all filtered orders:
export async function getAllFilteredOrders({
    query    = "",
    page     = 1,
    limit    = PAGE_SIZE,
    orderBy  = "createdAt",
    order    = "desc",
  }: GetOrderOpts) {
    const where: Prisma.OrderWhereInput = {}
    const OR:    Prisma.OrderWhereInput[] = []
  
    if (query) {
      const q = query.trim().toLowerCase()

  
      // 2) UUID match
      if (isUuid(q)) {
        OR.push({ id: q })
      }
  
      // 3) Buyer name
      OR.push({
        user: { name: { contains: query, mode: "insensitive" } },
      })
  
      // 4) JSON fields (e.g. storeName, city)
      OR.push({
        shippingAddress: { path: ["storeName"], string_contains: query },
      })
      OR.push({
        shippingAddress: { path: ["address","city"], string_contains: query },
      })
  
      where.OR = OR
    }
  
    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { [orderBy]: order },
        include: {
            user: {
                select: {name: true}
            }
        }
      }),
      prisma.order.count({ where }),
    ])
  
    return { data, totalPages: Math.ceil(total / limit) }
  }

//delete an order
export async function deleteOrder (id:string): Promise<{ success: boolean; message: string }> {
    try{
        await prisma.order.delete({where:{id}})
        revalidatePath('/admin/orders')
        return {success:true, message: 'Order Deleted Succesfully.'}
    }catch (err){
        return {success:false, message: formatError(err)}
    } 
}


//update order to paid
export async function updateOrderToPaidManual(orderId: string): Promise<{ success: boolean; message: string }>{
    try{
       await updateOrderPaid({orderId});
       
       revalidatePath(`/order/${orderId}`);

       return {success: true, message: 'Order marked as paid'}
    }catch(err){
        return {success:false, message:formatError(err)}
    }
}

//Update order to delivered (manually)
//update order to paid
export async function updateOrderToDeliveredManual(orderId: string): Promise<{ success: boolean; message: string }>{
    try{
       
        const order = await prisma.order.findFirst({
            where:{
                id:orderId
            },
        })
       if(!order) throw new Error('order not found')
        if(!order.paidAt) throw new Error ('Order is not paid')

       revalidatePath(`/order/${orderId}`);
        await prisma.order.update({
            where:{id:orderId},
            data:{
                deliveredAt: new Date(),
            },
        })
        revalidatePath(`/order/${orderId}`);
       return {success: true, message: 'Order marked as paid'}
    }catch(err){
        return {success:false, message:formatError(err)}
    }
}