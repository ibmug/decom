import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import { insertProductSchema } from '@/lib/validators';
import { CardCondition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = insertProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid Request" }, { status: 400 });
    }

    const data = parsed.data;

    // ✅ Only allow ACCESSORY
    if (data.type !== 'ACCESSORY') {
      return NextResponse.json({ success: false, message: "Only ACCESSORY type supported in this route" }, { status: 400 });
    }

    const { slug, inventory, ...accessoryFields } = data;

    // First: create StoreProduct + Accessory relation
    const storeProduct = await prisma.storeProduct.create({
      data: {
        slug,
        type: 'ACCESSORY',
        accessory: {
          create: {
            name: accessoryFields.name,
            description: accessoryFields.description,
            brand: accessoryFields.brand,
            category: accessoryFields.category,
          },
        },
        price: data.price,  
        rating: data.rating,
        numReviews: data.numReviews,
        images: data.images,
      },
    });

    // Second: create Inventory entries (from array)
    await Promise.all(
      inventory.map((inv) =>
        prisma.inventory.create({
          data: {
            productId: storeProduct.id,
            stock: inv.stock,
            language: inv.language ?? 'EN',
            condition: (inv.condition ?? 'NM') as CardCondition,
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Product created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 });
  }
}
