import { getMyCart } from "@/lib/actions/cart.actions";
import { ShippingAddress } from "@/types";
import {Metadata} from "next";
import {redirect} from 'next/navigation'
import { getUserById } from "@/lib/actions/user.actions";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';
import PlaceOrderForm from "./place-order-form";

export const metadata:Metadata = {
    title: 'Confirm your Order',
};

const PlaceOrderPage = async () => {

    const cart = await getMyCart();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if(!userId) throw new Error('User Not Found');
    const user = await getUserById(userId);

    if(!cart || cart.items.length=== 0) redirect ('/cart');
    if(!user.address) redirect('/shipping-page');
    if(!user.paymentMethod) redirect('/payment-method');

    const userAddress = user.address as ShippingAddress;
    
    return (<>
    <CheckoutSteps current={3}/>
    <h1 className="py-4 text-2xl">Confirm Your Order</h1>
    <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto space-y-4">
            <Card>
            {userAddress.shippingMethod === 'DELIVERY' ? (
    <CardContent className="p-4 gap-4">
      <h2 className="text-xl pb-4">Shipping Address</h2>
      <p className="font-medium">
        {userAddress.address.fullName}
      </p>
      <p>
        {userAddress.address.streetName}, {userAddress.address.city},{' '}
        {userAddress.address.state}{' '}
        {userAddress.address.postalCode}, {userAddress.address.country}
      </p>
      <div className='mt-3'>
      <Link href="/shipping-address">
        <Button variant="outline">Edit</Button>
      </Link>
      </div>
    </CardContent>
  ) : (
    <CardContent className="p-4 gap-4">
      <h2 className="text-xl pb-4">Pick Up Location</h2>
      <p className="font-medium">
        Store Name: {userAddress.storeName}
      </p>
      <p className="font-medium">
        Store Address: {userAddress.storeAddress}
      </p>
      <div className='mt-3'>
      <Link href="/shipping-address">
        <Button variant="outline">Edit</Button>
      </Link>
      </div>
    </CardContent>
  )}
                
                <CardContent className="p-4 gap-4">
                    <h2 className="text-xl pb-4">Payment Method</h2>
                    <p>{user.paymentMethod}</p>
                    <div className='mt-3'>
                    <Link href={'/payment-method'}>
                    <Button variant='outline'>
                        Edit
                    </Button>
                    </Link>
                    </div>
                </CardContent>
                <CardContent className="p-4 gap-4">
                    <h2 className="text-xl pb-4">Order Items</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price</TableHead>
                            </TableRow>
                        </TableHeader>
                            <TableBody>
                                {cart.items.map((item)=>(
                                    <TableRow key={item.slug}>
                                        <TableCell>
                                            <Link href={`/product/${item.slug}`} className='flex items-center'>
                                            <Image src={item.image} alt={item.name} width={50} height={50}/>
                                            <span className='px-2'>{item.name}</span>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className='px-2'>{item.qty}</span>
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            {item.price}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardContent className = 'p-4 gap-4 space-y-4'>
                                <div className="flex justify-between">
                                    <div>
                                        Items:
                                    </div>
                                    <div>
                                        {formatCurrency(cart.itemsPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Tax:
                                    </div>
                                    <div>
                                        {formatCurrency(cart.taxPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Shipping:
                                    </div>
                                    <div>
                                        {formatCurrency(cart.shippingPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold text-red-600">
                                    <div>
                                        Total:
                                    </div>
                                    <div>
                                        {formatCurrency(cart.totalPrice)}
                                    </div>
                                </div>
                                <PlaceOrderForm/>
            </CardContent>
        </Card>
    </div>
    </> );
}
 
export default PlaceOrderPage;