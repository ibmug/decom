import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createOrder } from "@/lib/actions/order.actions";
import { ShippingAddress } from "@/types";
import { formatError } from "@/lib/utils/utils";
import { ShippingMethod } from "@prisma/client";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const shippingAddress = body.shippingAddress as ShippingAddress;
    const shippingMethod = body.shippingMethod as ShippingMethod;

    const result = await createOrder(shippingAddress, shippingMethod);

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId: result.data?.orderId,
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
  } catch (err) {
    
    return NextResponse.json(
      { success: false, message: formatError(err) ?? "Unknown error" },
      { status: 500 }
    );
  }
}
