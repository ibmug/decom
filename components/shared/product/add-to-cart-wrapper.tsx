

import { getMyCart } from '@/lib/actions/cart.actions';
import AddToCart from './add-to-cart';

interface Props {
  productId: string;
  inventoryId: string;
  stock: number; // ✅ fully required now
}

export default async function AddToCartWrapper({ productId, inventoryId, stock }: Props) {
  const response = await getMyCart()
  const cart = response.success ? response.data :undefined;
  return (
    <AddToCart
      cart={cart}
      item={{
        productId,
        inventoryId,
        qty: 1
      }}
      stock={stock} 
    />
  );
}
