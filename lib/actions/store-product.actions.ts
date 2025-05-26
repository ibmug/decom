import { prisma } from "@/db/prisma";
import { formatError } from "../utils/utils";

export async function updateStock({
  storeProductId,
  newStock,
}: {
  storeProductId: string;
  newStock: number;
}) {
  try {
    const existing = await prisma.storeProduct.findUnique({
      where: { id: storeProductId },
    });

    if (!existing) {
      return { success: false, message: "Product not found" };
    }

    await prisma.storeProduct.update({
      where: { id: storeProductId },
      data:  { stock: newStock },
    });

    return { success: true, message: "Stock updated successfully" };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}