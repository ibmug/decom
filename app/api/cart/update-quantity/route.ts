import { NextResponse } from "next/server";
import { updateCartItemQuantity } from "@/lib/actions/cart.actions";

export async function POST(req: Request) {
  const { productId, inventoryId, quantity } = await req.json();

  try {
    const result = await updateCartItemQuantity({
      productId,
      inventoryId,
      quantity
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "An error occurred." },
      { status: 500 }
    );
  }
}
