import { NextResponse } from "next/server";
import { updateCartItemQuantity } from "@/lib/actions/cart.actions";

export async function POST(req: Request) {
  const { itemId, quantity } = await req.json();
  try {
    const result = await updateCartItemQuantity(itemId, quantity);
    return NextResponse.json(result);
  } catch (error) {
    console.warn(error)
    return NextResponse.json({ success: false, message: "An error occurred." }, { status: 500 });
  }
}
