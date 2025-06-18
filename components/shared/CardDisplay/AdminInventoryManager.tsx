'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AdminInventoryManagerProps {
  productId: string;
  onInventoryAdded?: () => void;
}

const AdminInventoryManager: React.FC<AdminInventoryManagerProps> = ({ productId, onInventoryAdded }) => {
  const [language, setLanguage] = useState<string>('EN');
  const [condition, setCondition] = useState<string>('NM');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!price || !stock) {
      toast({ description: "Price and Stock are required", variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          language,
          condition,
          price: parseFloat(price),
          stock: parseInt(stock),
        }),
      });

      if (!res.ok) throw new Error('Failed to add inventory');

      if (onInventoryAdded) onInventoryAdded();
      toast({ description: "Inventory added successfully!" });
      setPrice('');
      setStock('');
    } catch (err) {
      console.error(err);
      toast({ description: 'Error adding inventory', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">

      <h3 className="font-semibold text-lg">Add Inventory</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">EN</SelectItem>
              <SelectItem value="ES">ES</SelectItem>
              <SelectItem value="JP">JP</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="DE">DE</SelectItem>
              <SelectItem value="FR">FR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="font-semibold">Condition</label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NM">NM</SelectItem>
              <SelectItem value="LP">LP</SelectItem>
              <SelectItem value="MP">MP</SelectItem>
              <SelectItem value="HP">HP</SelectItem>
              <SelectItem value="DMG">DMG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Price</label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="font-semibold">Stock</label>
          <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Add Inventory'}
      </Button>
    </div>
  );
};

export default AdminInventoryManager;
