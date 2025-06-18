import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";

// ✅ Strict input validation schema
const updatePriceSchema = z.object({
  productId: z.string(),
  price: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    // ✅ Session check
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updatePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 });
    }

    const { productId, price } = parsed.data;

    // ✅ Check if product exists
    const product = await prisma.storeProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    // ✅ Perform price update
    await prisma.storeProduct.update({
      where: { id: productId },
      data: { price },
    });

    return NextResponse.json({ success: true, message: "Price updated successfully" });
  } catch (err) {
    console.error("Error updating price:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
