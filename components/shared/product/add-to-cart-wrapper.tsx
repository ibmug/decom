import { getMyCart } from '@/lib/actions/cart.actions'
import AddToCart from './add-to-cart'

interface Props {
  productId: string
}

export default async function AddToCartWrapper({ productId }: Props) {
  const cart = await getMyCart()

  return <AddToCart cart={cart} item={{ id: productId, quantity: 1 }} />
}
