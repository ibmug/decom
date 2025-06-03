import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import { insertAccessoryProductSchema } from '@/lib/validators';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = insertAccessoryProductSchema.parse(body);
   const {
  slug,
  price,
  stock,
    ...accessoryFields
} = data;

    await prisma.storeProduct.create({
  data: {
    slug,
    price: new Prisma.Decimal(price),
    stock,
    type: 'ACCESSORY',
    accessory: {
      create: {
        ...accessoryFields,
      },
    },
  },
});

    return NextResponse.json({ success: true, message: 'Product created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 });
  }
}
