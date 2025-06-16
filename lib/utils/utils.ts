import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from 'query-string';
import { ApiResponse } from "@/types";
import { ProductWithRelations } from "./transformers";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert Prisma object into regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with decimal places
export function formatNumberWithDecimal(num: string | number): string {
  const [int, decimal] = num.toString().split('.');
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}

// Error formatter (Zod + Prisma)
export function formatError(error: unknown) {
  if (error instanceof ZodError) {
    const fieldErrors = error.errors.map((e) => e.message);
    return fieldErrors.join('.  ');
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'Field';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return JSON.stringify(error);
  }
}

// Round number to two decimals
export function roundtwo(value: number | string) {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Wrong type for rounding");
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2
});

// Format currency
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === 'number') {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === 'string') {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return 'NaN';
  }
}

export function isSafeRedirect(url: string) {
  const base = new URL(process.env.NEXTAUTH_URL!);
  const dest = new URL(url, base);
  return dest.origin === base.origin;
}

export function formatId(id: string) {
  return `...${id.substring(id.length - 6)}`;
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    year: 'numeric',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return {
    dateTime: new Date(dateString).toLocaleString('en-US', dateTimeOptions),
    dateOnly: new Date(dateString).toLocaleString('en-US', dateOptions),
    timeOnly: new Date(dateString).toLocaleString('en-US', timeOptions),
  };
};

export function formUrlQuery({
  params,
  key,
  value
}: {
  key: string,
  params: string,
  value: string | null
}) {
  const query = qs.parse(params);
  query[key] = value;
  return qs.stringifyUrl({
    url: window.location.pathname,
    query,
  }, {
    skipNull: true
  });
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export type BasicProduct = {
  id: string;
  slug: string;
  name: string;
  banner: string | null;
};

// 🔧 FULLY SCHEMA-SYNCED serializeProduct()
export function serializeProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    slug: product.slug,
    type: product.type,
    images: product.images,
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    inventory: product.inventory.map((inv) => ({
      id: inv.id,
      price: inv.price.toString(),
      stock: inv.stock,
      language: inv.language ?? undefined,
      condition: inv.condition ?? undefined,
    })),
    cardMetadata: product.cardMetadata ? {
      id: product.cardMetadata.id,
      name: product.cardMetadata.name,
      setCode: product.cardMetadata.setCode,
      setName: product.cardMetadata.setName,
      manaCost: product.cardMetadata.manaCost ?? undefined,
      oracleText: product.cardMetadata.oracleText ?? undefined,
      collectorNum: product.cardMetadata.collectorNum,
      colorIdentity: product.cardMetadata.colorIdentity,
      rarity: product.cardMetadata.rarity ?? undefined,
      type: product.cardMetadata.type ?? undefined,
      usdPrice: product.cardMetadata.usdPrice ?? undefined,
      usdFoilPrice: product.cardMetadata.usdFoilPrice ?? undefined,
    } : null,
    accessory: product.accessory ? {
      id: product.accessory.id,
      name: product.accessory.name,
      description: product.accessory.description ?? undefined,
      brand: product.accessory.brand ?? undefined,
      category: product.accessory.category ?? undefined,
      updatedAt: product.accessory.updatedAt,
    } : null
  };
}

export function assertApiSuccess<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.message);
  }
  return res.data!;
}
