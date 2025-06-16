import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { UpdateProductInput } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ <- workaround for Next.js type inference
) {
  const { id } = await params;
  const data: UpdateProductInput = await req.json();

  const updatedProduct = await prisma.storeProduct.update({
    where: { id },
    data: {
      slug: data.slug,
      type: data.type,
      cardMetadataId: data.cardMetadataId ?? null,
      accessoryId: data.accessoryId ?? null,
      storeId: data.storeId ?? null,
      rating: data.rating ?? null,
      numReviews: data.numReviews ?? null,
      images: data.images ?? [],
    },
  });

  if (data.type === "ACCESSORY" && data.accessoryId) {
    await prisma.accessoryProduct.update({
      where: { id: data.accessoryId },
      data: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        brand: data.brand ?? undefined,
        category: data.category ?? undefined,
      },
    });
  }

  return NextResponse.json({ success: true, updatedProduct });
}
