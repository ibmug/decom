import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import { insertAccessoryProductSchema} from '@/lib/validators';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/authOptions';
import slugify from 'slugify';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log("B ODY")
    console.log(body)
    const parsed = insertAccessoryProductSchema.safeParse(body);
    

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid Request" },
        { status: 400 }
      );

    }

    const { price, images, name, description, brand, category } = parsed.data;
    const safeSlug = slugify(name+brand,{lower: true, strict:true})

    // Create StoreProduct + Accessory + Inventory
    await prisma.storeProduct.create({
      data: {
        slug:safeSlug,
        type: 'ACCESSORY',
        accessory: {
          create: { name, description, brand, category },
        },
        price,
        images,
        inventory: {
          create: {
            stock: 1,
            language: 'EN',
            condition: 'NM',
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Product created' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: formatError(error) },
      { status: 500 }
    );
  }
}
