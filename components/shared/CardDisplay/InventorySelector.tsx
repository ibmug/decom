'use client';

import React, { useState, useMemo } from 'react';
import { UIInventory } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface InventorySelectorProps {
  inventory: UIInventory[];
  onAddToCart: (inventoryId: string) => void;
}

const InventorySelector: React.FC<InventorySelectorProps> = ({ inventory, onAddToCart }) => {
  const availableConditions = Array.from(new Set(inventory.map(inv => inv.condition ?? 'Unknown')));
  const availableLanguages = Array.from(new Set(inventory.map(inv => inv.language ?? 'Unknown')));

  const [selectedCondition, setSelectedCondition] = useState<string>(availableConditions[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(availableLanguages[0]);

  const selectedInventory = useMemo(() => {
    return inventory.find(inv =>
      (inv.condition ?? 'Unknown') === selectedCondition &&
      (inv.language ?? 'Unknown') === selectedLanguage
    );
  }, [selectedCondition, selectedLanguage, inventory]);

  return (
    <div className="space-y-4">

      <div>
        <div className="font-semibold mb-1">Condition</div>
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {availableConditions.map(cond => (
              <SelectItem key={cond} value={cond}>
                {cond}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="font-semibold mb-1">Language</div>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map(lang => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center">
        <span>Status</span>
        {selectedInventory && selectedInventory.stock > 0 ? (
          <Badge variant="outline">In Stock ({selectedInventory.stock})</Badge>
        ) : (
          <Badge variant="destructive">Sold Out</Badge>
        )}
      </div>

      <Button
        onClick={() => selectedInventory && onAddToCart(selectedInventory.id)}
        disabled={!selectedInventory || selectedInventory.stock <= 0}
      >
        Add to Cart
      </Button>

    </div>
  );
};

export default InventorySelector;
