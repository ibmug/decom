// db/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Cache separate Prisma clients across HMR
  // @ts-ignore
  var __DB__: {
    raw?: PrismaClient;
    extended?: PrismaClient;
  };
}

// 1) Raw (legacy) Prisma client
const rawPrisma: PrismaClient =
  globalThis.__DB__?.raw ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__ = globalThis.__DB__ || {};
  globalThis.__DB__.raw = rawPrisma;
}

// 2) Extended Prisma client with compute hooks
const extendedPrisma: PrismaClient =
  globalThis.__DB__?.extended ??
  rawPrisma.$extends({
    result: {
      product: {
        price:   { compute(p) { return p.price != null ? p.price.toString() : null; } },
        rating:  { compute(p) { return p.rating != null ? p.rating.toString() : null; } },
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

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__.extended = extendedPrisma;
}

export const legacyPrisma = rawPrisma;
export const prisma = extendedPrisma;
