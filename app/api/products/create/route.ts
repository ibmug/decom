import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import { insertAccessoryProductSchema } from '@/lib/validators';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = insertAccessoryProductSchema.parse(body);

    const { slug, price, stock, ...accessoryFields } = data;

    // First: create StoreProduct + Accessory relation
    const storeProduct = await prisma.storeProduct.create({
      data: {
        slug,
        type: 'ACCESSORY',
        accessory: {
          create: {
            ...accessoryFields,
          },
        },
      },
    });

    // Second: create Inventory linked to the StoreProduct
    await prisma.inventory.create({
      data: {
        productId: storeProduct.id,
        price: new Prisma.Decimal(price),
        stock: stock,
        language: 'en',      // default language (or allow admin input)
        condition: 'NM',     // default condition (can adjust)
      },
    });

    return NextResponse.json({ success: true, message: 'Product created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 });
  }
}
