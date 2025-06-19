import {  getMyCart } from "@/lib/actions/cart.actions";
import CartTable from "./cart-table";

export const dynamic = 'force-dynamic'

export const metadata = {
  title:'Carrito',
}

const CartPage = async () => {

  const result = await getMyCart();
if (!result.success) throw new Error(result.message);
const cart = result.data;
//console.log("CARTPAGE:", JSON.stringify(cart,null, 2))


  return (<div>
    <CartTable cart={cart}/>
  </div>);

}


export default CartPage;
  