// db/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // These live on globalThis to survive HMR in dev
  // @ts-ignore
  var __DB__: {
    raw?:    PrismaClient;
    extended?: unknown;    // let TS infer the real extended type
  };
}

// 1) Create or re-use the raw client
const rawPrisma: PrismaClient =
  globalThis.__DB__?.raw ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__ = globalThis.__DB__ || {};
  globalThis.__DB__.raw = rawPrisma;
}

// 2) Extend it with your compute hooks (no explicit : PrismaClient annotation)
const extendedPrisma =
  // if already created in HMR, re-use
  (globalThis.__DB__?.extended as typeof rawPrisma) ??
  rawPrisma.$extends({
    result: {
      product: {
        price:   { compute(p) { return p.price?.toString()  ?? null } },
        rating:  { compute(p) { return p.rating?.toString() ?? null } },
      },
      cart: {
        itemsPrice:    { needs: { itemsPrice: true },    compute(c) { return c.itemsPrice.toString()    } },
        shippingPrice: { needs: { shippingPrice: true }, compute(c) { return c.shippingPrice.toString() } },
        taxPrice:      { needs: { taxPrice: true },      compute(c) { return c.taxPrice.toString()      } },
        totalPrice:    { needs: { totalPrice: true },    compute(c) { return c.totalPrice.toString()    } },
      },
      order: {
        itemsPrice:    { needs: { itemsPrice: true },    compute(o) { return o.itemsPrice.toString()    } },
        shippingPrice: { needs: { shippingPrice: true }, compute(o) { return o.shippingPrice.toString() } },
        taxPrice:      { needs: { taxPrice: true },      compute(o) { return o.taxPrice.toString()      } },
        totalPrice:    { needs: { totalPrice: true },    compute(o) { return o.totalPrice.toString()    } },
      },
      orderItem: {
        price: { compute(oi) { return oi.price.toString() } },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__.extended = extendedPrisma;
}

// 3) Export only the extended client for your app to use
export const prisma = extendedPrisma;
