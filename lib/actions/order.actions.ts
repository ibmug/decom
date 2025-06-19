'use server';

import { prisma } from '@/db/prisma';
import { authOptions } from '../authOptions';
import { getServerSession } from 'next-auth';
import { ShippingAddress, UIOrderItem, Order, PaymentResult, UIOrderListItem } from '@/types';
import { insertOrderItemSchema, insertOrderSchema } from '@/lib/validators';
import { OrderStatus, Prisma } from '@prisma/client';
import { getMyCart } from './cart.actions';
import { formatError } from '../utils/utils';
import { paypalUtils } from '../paypalUtils';
import { revalidatePath } from 'next/cache';

// ================= CREATE ORDER =================

export async function createOrder() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    const userId = session.user.id;
    const cartResult = await getMyCart();

    if (!cartResult.success) {
      return { success: false, message: 'Failed to load cart' };
    }
    const cart = cartResult.data!;

    if (cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }

    for (const item of cart.items) {
      const inventory = await prisma.inventory.findUnique({ where: { id: item.inventoryId } });
      if (!inventory || inventory.stock < item.qty) {
        return { success: false, message: `Not enough stock for ${item.name}` };
      }
    }

    const shippingMethod = 'DELIVERY';
    const shippingAddress = {} as ShippingAddress;

    const parsedOrder = insertOrderSchema.parse({
      userId,
      shippingMethod,
      shippingAddress,
      paymentMethod: 'paypal',
      shippingPrice: Number(cart.shippingPrice),
      taxPrice: Number(cart.taxPrice),
      itemsPrice: Number(cart.itemsPrice),
      totalPrice: Number(cart.totalPrice),
    });

    const orderId = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          shippingMethod,
          shippingAddress,
          paymentMethod: parsedOrder.paymentMethod,
          shippingPrice: parsedOrder.shippingPrice,
          taxPrice: parsedOrder.taxPrice,
          itemsPrice: parsedOrder.itemsPrice,
          totalPrice: parsedOrder.totalPrice,
          status: OrderStatus.PENDING,
        },
      });

      for (const item of cart.items) {
        const parsedItem = insertOrderItemSchema.parse({
          productId: item.productId,
          inventoryId: item.inventoryId,
          slug: item.slug,
          image: item.image,
          name: item.name,
          price: item.price,
          qty: item.qty,
        });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: parsedItem.productId,
            inventoryId: parsedItem.inventoryId,
            slug: parsedItem.slug,
            name: parsedItem.name,
            image: parsedItem.image,
            price: parsedItem.price,
            qty: parsedItem.qty,
          },
        });

        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: { stock: { decrement: item.qty } },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { items: { deleteMany: {} } },
      });

      return order.id;
    });

    return { success: true, message: 'Order created', data: { orderId } };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

// ================= GET ORDER BY ID =================
export async function getOrderById(orderId: string): Promise<Order | null> {
  const res = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      orderItems: true,
    },
  });

  if (!res) return null;

  const shippingAddress = res.shippingAddress as ShippingAddress;

  return {
    id: res.id,
    userId: res.userId,
    user: res.user!,
    shippingMethod: res.shippingMethod,
    shippingAddress,
    paymentMethod: res.paymentMethod,
    itemsPrice: Number(res.itemsPrice),
    shippingPrice: Number(res.shippingPrice),
    taxPrice: Number(res.taxPrice),
    totalPrice: Number(res.totalPrice),
    paidAt: res.paidAt,
    deliveredAt: res.deliveredAt,
    createdAt: res.createdAt,
    status: res.status,
    orderItems: res.orderItems.map((oi) => ({
      productId: oi.productId,
      inventoryId: oi.inventoryId,
      name: oi.name,
      slug: oi.slug,
      image: oi.image,
      price: +oi.price,
      qty: oi.qty,
    })) as UIOrderItem[],
  };
}

// ================= GET MY ORDERS =================
export async function getMyOrders({ userId, page = 1, limit = 10 }: { userId: string; page?: number; limit?: number; }) {
  const skip = (page - 1) * limit;
  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { orderItems: true },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const data: UIOrderListItem[] = orders.map(order => ({
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalPrice: order.totalPrice.toFixed(2),
    itemCount: order.orderItems.length,
  }));

  const totalPages = Math.ceil(totalCount / limit);
  return { data, totalPages };
}

// ================= ADMIN FILTERED ORDERS =================
export async function getAllFilteredOrders({ status, page = 1, pageSize = 10 }: { status?: OrderStatus; page?: number; pageSize?: number; }) {
  const where: Prisma.OrderWhereInput = status ? { status } : {};
  const totalOrders = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    skip: (page - 1) * pageSize,
    include: { user: true, orderItems: true },
  });

  return {
    orders: orders.map(order => ({
      id: order.id,
      user: order.user,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      status: order.status,
      totalPrice: order.totalPrice.toString(),
      orderItems: order.orderItems.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
    })),
    totalPages: Math.ceil(totalOrders / pageSize),
    currentPage: page,
  };
}

// ================= PAYPAL =================
export async function createPayPalOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const paypalOrder = await paypalUtils.createOrder(Number(order.totalPrice));

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: paypalOrder.id,
          email_address: '',
          status: '',
          pricePaid: 0,
        },
      },
    });

    return { success: true, message: 'Paypal order created', data: paypalOrder.id };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function approvePayPalOrder(orderId: string, data: { orderId: string }) {
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const captureData = await paypalUtils.capturePayment(data.orderId);

    if (!captureData || captureData.id !== (order.paymentResult as PaymentResult)?.id || captureData.status !== 'COMPLETED') {
      throw new Error('Error in Paypal payment');
    }

    await updateOrderPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Your order has been paid.' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

async function updateOrderPaid({ orderId, paymentResult }: { orderId: string; paymentResult?: PaymentResult }) {
  const order = await prisma.order.findFirst({ where: { id: orderId }, include: { orderItems: true } });
  if (!order) throw new Error('Order Not Found');
  if (order.paidAt) throw new Error('Order is already paid');

  await prisma.$transaction(async (tx) => {
  for (const item of order.orderItems) {
    await tx.inventory.update({
      where: { id: item.inventoryId },
      data: { stock: { increment: -item.qty } }
    });
  }
  await tx.order.update({ where: { id: orderId }, data: { paidAt: new Date(), paymentResult } });
});
}

// ================= ORDER SUMMARY (ADMIN) =================
export async function getOrderSummary() {
  const ordersCount = await prisma.order.count();
  const usersCount = await prisma.user.count();
  const productsCount = await prisma.storeProduct.count();

  const totalSales = await prisma.order.aggregate({ _sum: { totalPrice: true } });
  const latestSales = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  const salesDataRaw = await prisma.order.groupBy({
    by: ['createdAt'],
    _sum: { totalPrice: true },
    orderBy: { createdAt: 'asc' },
  });

  const salesData = salesDataRaw.map(entry => ({
    month: entry.createdAt.toISOString().slice(0, 7),
    totalSales: Number(entry._sum.totalPrice ?? 0),
  }));

  return {
    ordersCount,
    usersCount,
    productsCount,
    totalSales,
    latestSales,
    salesData,
  };
}

// ================= MANUAL STATUS UPDATES =================
export async function updateOrderToPaidManual(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { paidAt: new Date(), status: OrderStatus.PAID },
    });
    return { success: true, message: 'Order marked as paid.' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function updateOrderToDeliveredManual(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveredAt: new Date(), status: OrderStatus.DELIVERED },
    });
    return { success: true, message: 'Order marked as delivered.' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}
