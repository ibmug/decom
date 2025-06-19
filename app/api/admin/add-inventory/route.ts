import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";
import { isValidEnumValue } from "@/lib/utils/typeguards";
import { CardCondition } from "@prisma/client";


const addInventorySchema = z.object({
  productId: z.string(),
  language: z.string().max(5),
  condition: z.string().max(5),
  stock: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addInventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 });
    }

    const { productId, language, condition, stock } = parsed.data;


if (condition && !isValidEnumValue(condition, CardCondition)) {
  return NextResponse.json({ success: false, message: "Invalid card condition" }, { status: 400 });
}

    
    const product = await prisma.storeProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    //  Prevent duplicate inventory entry for same language/condition
    const existingInventory = await prisma.inventory.findFirst({
      where: { productId, language, condition: condition as CardCondition }
    });

    if (existingInventory) {
      return NextResponse.json({
        success: false,
        message: "Inventory for this language and condition already exists. Use stock update if needed.",
      }, { status: 400 });
    }

    //  Create inventory row (only stock now)
    await prisma.inventory.create({
      data: {
        productId,
        language,
        condition: condition as CardCondition,
        stock,
      }
    });

    return NextResponse.json({ success: true, message: "Inventory added successfully" });
  } catch (err) {
    console.error("Error adding inventory:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
