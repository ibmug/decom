// db/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Tell TS there *might* be a __db_prisma__ on globalThis
  // @ts-ignore
  var __db_prisma__: PrismaClient | undefined;
}

// Use the cast to any when accessing globalThis
const _prisma =
  (globalThis as any).__db_prisma__ ??
  new PrismaClient().$extends({
    result: {
      product: {
        price:   { compute(p) { return p.price.toString(); } },
        rating:  { compute(p) { return p.rating.toString(); } },
      },
      cart: {
        itemsPrice:    { needs: { itemsPrice: true },    compute(c) { return c.itemsPrice.toString(); } },
        shippingPrice: { needs: { shippingPrice: true }, compute(c) { return c.shippingPrice.toString(); } },
        taxPrice:      { needs: { taxPrice: true },      compute(c) { return c.taxPrice.toString(); } },
        totalPrice:    { needs: { totalPrice: true },    compute(c) { return c.totalPrice.toString(); } },
      },
      order: {
        itemsPrice:    { needs: { itemsPrice: true },    compute(o) { return o.itemsPrice.toString(); } },
        shippingPrice: { needs: { shippingPrice: true }, compute(o) { return o.shippingPrice.toString(); } },
        taxPrice:      { needs: { taxPrice: true },      compute(o) { return o.taxPrice.toString(); } },
        totalPrice:    { needs: { totalPrice: true },    compute(o) { return o.totalPrice.toString(); } },
      },
      orderItem: {
        price: { compute(oi) { return oi.price.toString(); } },
      },
    },
  });

// In development, attach to globalThis so HMR reuses the same client
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).__db_prisma__ = _prisma;
}

export const prisma = _prisma;
