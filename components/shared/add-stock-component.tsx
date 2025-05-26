import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStock } from "@/lib/actions/store-product.actions";

interface AddStockProps {
  cardProductId: string;
  initialStock: number;
}

export default function AddStock({ cardProductId, initialStock }: AddStockProps) {
  const [stock, setStock] = useState(initialStock);
  const [input, setInput] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAddStock = async () => {
    if (!input || input <= 0) return;
    setLoading(true);
    try {
      const result = await updateStock({
        storeProductId: cardProductId,
        newStock: stock + input,
      });
      if (result.success) {
        setStock(stock + input);
        setInput(0);
      } else {
        console.error("Update failed:", result.message);
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border p-4 rounded-lg w-fit">
      <p className="text-sm">Current stock: <strong>{stock}</strong></p>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          min={1}
          value={input}
          onChange={(e) => setInput(Number(e.target.value))}
          className="w-24"
        />
        <Button onClick={handleAddStock} disabled={loading || input <= 0}>
          {loading ? "Adding..." : "Add Stock"}
        </Button>
      </div>
    </div>
  );
}
