// db/prisma.ts
import { UIProduct } from '@/types';
import { Order, PrismaClient } from '@prisma/client';

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
      price: {
        compute(p: UIProduct) {
          return p.price.toString();
        },
      },
      rating: {
        compute(p: UIProduct) {
          return p.rating.toString();
        },
      },
    },
    order: {
      itemsPrice: {
        compute(o: Order) {
          return o.itemsPrice.toString();
        },
      },
      shippingPrice: {
        compute(o: Order) {
          return o.shippingPrice.toString();
        },
      },
      taxPrice: {
        compute(o: Order) {
          return o.taxPrice.toString();
        },
      },
      totalPrice: {
        compute(o: Order) {
          return o.totalPrice.toString();
        },
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__.extended = extendedPrisma;
}

// 3) Export only the extended client for your app to use
export const prisma = extendedPrisma;
