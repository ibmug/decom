import { PrismaClient, StoreProduct, Order } from '@prisma/client';

declare global {
  var __DB__: {
    raw?: PrismaClient;
    extended?: unknown;
  };
}

const rawPrisma: PrismaClient =
  globalThis.__DB__?.raw ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DB__ = globalThis.__DB__ || {};
  globalThis.__DB__.raw = rawPrisma;
}

const extendedPrisma =
  (globalThis.__DB__?.extended as typeof rawPrisma) ??
  rawPrisma.$extends({
    result: {
      storeProduct: {
        rating: {
          compute(p: StoreProduct) {
            return p.rating?.toString() ?? "0";
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

export const prisma = extendedPrisma;
