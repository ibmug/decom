'use client'

import { Order } from "@/types";
import { formatDateTime, formatId } from "@/lib/utils/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/utils";
import { useToast } from "@/hooks/use-toast";
//import { Cart } from "@prisma/client";
import {PayPalButtons,PayPalScriptProvider,usePayPalScriptReducer} from '@paypal/react-paypal-js';
import { createPayPalOrder, approvePayPalOrder, updateOrderToDeliveredManual, updateOrderToPaidManual } from "@/lib/actions/order.actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";


    const  OrderDetailsCard = ({order, paypalClientId,isAdmin}: {order: Order,paypalClientId: string, isAdmin: boolean}) => {
        const {shippingAddress,orderItems,itemsPrice,shippingPrice,taxPrice,totalPrice,paymentMethod,status,id,paidAt,deliveredAt} = order;
        const {toast} = useToast();
        const PrintLoadingState = () =>{
            const [{isPending,isRejected}] = usePayPalScriptReducer();
            let status = '';
            if (isPending){
                status = 'Loading paypal...'
            } else if (isRejected){
                status = 'Error Loading Paypal'
            }
            return status;
        }

        const handleCreatePaypalOrder = async () =>{
            //This is a create order handler
            const res = await createPayPalOrder(order.id);
            if(!res.success){
                toast({
                    variant:'destructive',
                    description:res.message
                });
            }
            return res.data
        }

        const handleApprovePayPalOrder = async (data: {orderId: string;})=>{
            const res = await approvePayPalOrder(order.id, data);
            toast({
                variant:res.success ? 'default' : 'destructive',
                description:res.message
            });
        };

        const MarkAsPaidButton = () => {
            const [isPending, startTransition] = useTransition();
            const {toast} = useToast();

            return (<Button type="button" disabled={isPending} onClick={()=> startTransition(async () => { 
                const res = await updateOrderToPaidManual(order.id);
                toast({variant:res.success ? 'default' : 'destructive', description: res.message})
            })}>
                {isPending ? 'processing...' : 'Marked as Paid'}
            </Button>)
        }

        const MarkAsDeliveredButton= () => {
            const [isPending, startTransition] = useTransition();
            const {toast} = useToast();

            return (<Button type="button" disabled={isPending} onClick={()=> startTransition(async () => { 
                const res = await updateOrderToDeliveredManual(order.id);
                toast({variant:res.success ? 'default' : 'destructive', description: res.message})
            })}>
                {isPending ? 'processing...' : 'Marked as Delivered'}
            </Button>)
        }

    return (
    <>
        <h1 className="py-4 text-2xl"> Order {formatId(id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            <div className="col-span-2 space-4-y overflow-x-auto">
                <Card className="my-2">
                    <CardContent className='p-4 gap-4'>
                        <h2 className="text-xl pb-4">Status</h2>
                       <p className='mb-2'><b>Payment Method:</b> {paymentMethod}</p>
<Badge variant='secondary'>Status: {status}</Badge>

                        
                    </CardContent>
                </Card>
                <Card className="my-2">
                    <CardContent className='p-4 gap-4'>
                        <h2 className="text-xl pb-4">PaymentMethod</h2>
                        <p className='mb-2'>{paymentMethod}</p>
                        {<Badge variant={paidAt ? 'secondary' : 'destructive'}>
  {paidAt ? `Paid at: ${formatDateTime(paidAt).dateTime}` : 'Not Paid'}
</Badge>
}
                    </CardContent>
                </Card>
                <Card className="my-2">
                    <CardContent className='p-4 gap-4'>
                        
                        { order.shippingMethod === 'DELIVERY' ? (
                            <>
                            <h2 className="text-xl pb-4">Shipping Address</h2>
                            <p>{shippingAddress.address.streetName}</p>
                            <p>{shippingAddress.address.country}</p>
                            <p>{shippingAddress.address.city}</p>
                            <p>{shippingAddress.address.state}</p>
                            <p>{shippingAddress.address.postalCode}</p> 
                            <p><b className="bg-blend-color">Contact:</b> {shippingAddress.address.phone}</p>
                            {deliveredAt ? (
                            <Badge variant='secondary'>
                                Delivered at: {formatDateTime(deliveredAt!).dateTime}
                            </Badge>
                        ) : (
                            <Badge variant='destructive'>
                                Not Delivered Yet
                            </Badge>
                         ) }
                            </>
                    
                    ) : (
                    <>
                    <h2 className="text-xl pb-4">Store Address Pickup</h2>
                    <p>{shippingAddress.addressName}</p>
                    <p>{shippingAddress.address.streetName}</p> 
                    {deliveredAt ? (
                            <Badge variant='secondary'>
                                Delivered at: {formatDateTime(deliveredAt!).dateTime}
                            </Badge>
                        ) : (
                            <Badge variant='destructive'>
                                Not Picked Up
                            </Badge>
                         ) }
                    </>
                    )}
                    </CardContent>
                </Card>
                <Card>
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
                                {orderItems.map((item) => (
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
            <div>
        <Card>
            <CardContent className = 'p-4 gap-4 space-y-4'>
                                <div className="flex justify-between">
                                    <div>
                                        Items:
                                    </div>
                                    <div>
                                        {formatCurrency(itemsPrice.toString())}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Tax:
                                    </div>
                                    <div>
                                        {formatCurrency(taxPrice.toString())}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Shipping:
                                    </div>
                                    <div>
                                        {formatCurrency(shippingPrice.toString())}
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold text-red-600">
                                    <div>
                                        Total:
                                    </div>
                                    <div>
                                        {formatCurrency(totalPrice.toString())}
                                    </div>
                                </div>
                                {/*Paypal Payment */}
                                {!paidAt && paymentMethod === 'PayPal' && (
                                    <div>
                                        <PayPalScriptProvider options={{clientId: paypalClientId}}>
                                            <PrintLoadingState />
                                        {/*<PayPalButtons createOrder={handleCreatePaypalOrder} onApprove={handleApprovePayPalOrder}/>*/}
                                        <PayPalButtons createOrder={handleCreatePaypalOrder} onApprove={async (data) => {
    // data.orderID is the PayPal-generated order ID
    
    await handleApprovePayPalOrder({ orderId: data.orderID });
  }}/>
                                        </PayPalScriptProvider>
                                    </div>
                                )}
                    {/* Cash on Delivery*/}
                    {isAdmin && paymentMethod==='CashOnPickup' && (
                        <MarkAsPaidButton />
                    )}
                    {isAdmin && !deliveredAt && (
                        <MarkAsDeliveredButton />
                    )}
            </CardContent>
        </Card>

        </div>
        </div>
    </>
    );
}

export default OrderDetailsCard;