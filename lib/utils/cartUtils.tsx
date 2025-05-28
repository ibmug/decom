import { getMyCart } from "../actions/cart.actions";

export async function calculateCartTotals(cart: Awaited<ReturnType<typeof getMyCart>>) {
  const itemsPrice = cart?.items.reduce((acc, item) => {
    return acc + Number(item.storeProduct.price) * item.quantity;
  }, 0) ?? 0;

  const shippingPrice = itemsPrice > 100 ? 0 : 100;
  const taxPrice = 0.15 * itemsPrice;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
}
