import { updateCartItemQuantity } from "@/lib/actions/cart.actions";

export async function POST(req: Request) {
  try {
    const { productId, inventoryId, quantity } = await req.json();

    if (!productId || !inventoryId)
      return Response.json({ success: false, message: "Missing productId or inventoryId" });

    const result = await updateCartItemQuantity({
      productId,
      inventoryId,
      quantity: Number(quantity),
    });

    return Response.json(result);

  } catch (err) {
    console.error(err);
    return Response.json({ success: false, message: "Failed to update quantity" });
  }
}
