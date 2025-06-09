'use client';

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { Minus, Plus, ArrowRight, Loader } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatError } from "@/lib/utils/utils";
import { Card, CardContent } from "@/components/ui/card";
import { UICart } from "@/types";

const CartTable = ({ cart }: { cart?: UICart }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch("/api/cart/update-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({ description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ description: formatError(err), variant: "destructive" });
    }
  };

  return (
    <>
      <h1 className="py-4 h2-bold">Tu carrito</h1>
      {!cart || cart.items.length === 0 ? (
        <div>
          Tu carrito está vacío! <Link href="/">Busca productos!</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
  {cart.items.map((item) => {
    const productUrl =
      item.type === "CARD"
        ? `/card/${item.slug}`
        : `/product/${item.slug}`;

    const hasStockIssue = item.qty > item.stock;

    return (
      <TableRow key={item.id}>
        <TableCell>
          <Link href={productUrl} className="flex items-center">
            <Image
              src={item.image}
              alt={item.name}
              width={50}
              height={50}
            />
            <span className="px-2">{item.name}</span>
          </Link>
          {hasStockIssue && (
            <div className="text-sm text-red-500">
              Solo quedan {item.stock} disponibles
            </div>
          )}
        </TableCell>

        <TableCell className="flex-center gap-2">
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() =>
              startTransition(() =>
                handleQuantityChange(item.storeProductId, -1)
              )
            }
          >
            {isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </Button>

          <span className="px-2">{item.qty}</span>

          <Button
            disabled={isPending}
            variant="outline"
            onClick={() =>
              startTransition(() =>
                handleQuantityChange(item.storeProductId, 1)
              )
            }
          >
            {isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </TableCell>

        <TableCell className="text-right">
          {item.price}
        </TableCell>
      </TableRow>
    );
  })}
</TableBody>
            </Table>
          </div>

          <Card>
            <CardContent className="p-4 gap-4">
              <div className="pb-3 text-xl">
                Subtotal (
                {cart.items.reduce((sum, item) => sum + item.qty, 0)}):
                <span className="font-bold">
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => router.push("/shipping-address"))
                }
              >
                {isPending ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Proceed To Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default CartTable;
