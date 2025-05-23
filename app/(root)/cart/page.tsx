import CartTable from "./cart-table";
import { getMyCart } from "@/lib/actions/cart.actions";
export const dynamic = 'force-dynamic'

export const metadata = {
  title:'Carrito',
}

const CartPage = async () => {

  const cart = await getMyCart();

  return (<div>
    <CartTable cart={cart}/>
  </div>);

}


export default CartPage;
  