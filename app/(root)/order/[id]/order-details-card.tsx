'use client'

import { Order } from "@/types";
import { formatDateTime, formatId } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types";
//import { Cart } from "@prisma/client";

    const  OrderDetailsCard = ({order}: {order: Order}) => {
        const {shippingAddress,orderItems,itemsPrice,shippingPrice,taxPrice,totalPrice,paymentMethod,isPaid,isDelivered,id,paidAt,deliveredAt} = order;


    return (
    <>
        <h1 className="py-4 text-2xl"> Order {formatId(id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            <div className="col-span-2 space-4-y overflow-x-auto">
                <Card className="my-2">
                    <CardContent className='p-4 gap-4'>
                        <h2 className="text-xl pb-4">PaymentMethod</h2>
                        <p className='mb-2'>{paymentMethod}</p>
                        {isPaid ? (
                            <Badge variant='secondary'>
                                Paid at: {formatDateTime(paidAt!).dateTime}
                            </Badge>
                        ) : (
                            <Badge variant='destructive'>
                                Not Paid
                            </Badge>
                         ) }
                    </CardContent>
                </Card>
                <Card className="my-2">
                    <CardContent className='p-4 gap-4'>
                        
                        { shippingAddress.shippingMethod === 'DELIVERY' ? (
                            <>
                            <h2 className="text-xl pb-4">Shipping Address</h2>
                            <p>{shippingAddress.address.streetName}</p>
                            <p>{shippingAddress.address.country}</p>
                            <p>{shippingAddress.address.city}</p>
                            <p>{shippingAddress.address.state}</p>
                            <p>{shippingAddress.address.postalCode}</p> 
                            <p><b className="bg-blend-color">Contact:</b> {shippingAddress.address.phone}</p>
                            {isDelivered ? (
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
                    <p>{shippingAddress.storeName}</p>
                    <p>{shippingAddress.storeAddress}</p> 
                    {isDelivered ? (
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
                                {orderItems.map((item: CartItem)=>(
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
                                        {formatCurrency(itemsPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Tax:
                                    </div>
                                    <div>
                                        {formatCurrency(taxPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        Shipping:
                                    </div>
                                    <div>
                                        {formatCurrency(shippingPrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold text-red-600">
                                    <div>
                                        Total:
                                    </div>
                                    <div>
                                        {formatCurrency(totalPrice)}
                                    </div>
                                </div>
            </CardContent>
        </Card>
        </div>
        </div>
    </>
    );
}

export default OrderDetailsCard;