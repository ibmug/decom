
//import { getServerSession } from "next-auth";
//import { authOptions } from "@/lib/authOptions";
import { deleteOrder, getAllOrders } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime,formatId } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";
import { shippingAddressSchema } from "@/lib/validators";


export const metadata : Metadata = {
    title: 'Admin Orders',
}




const AdminOrdersPage = async (props: {
    searchParams: Promise<{page: string}>
}) => {
    const {page = '1'} = await props.searchParams;
    //const session = getServerSession(authOptions);





    const orders = await getAllOrders({
        page: Number(page),
        limit: 10
    });

    const viewOrders = orders.data.map(order => {
        // parse+validate shippingAddress, throws if invalid
        const sa = shippingAddressSchema.parse(order.shippingAddress)
    
        return {
          ...order,
          shippingAddress: sa,        // now strongly typed
        }
      })


    return (<div className="space-y-2">
        <h2 className="h2-bold">Orders</h2>
        <div className="overflow-x-auto">
       
                    <Table className=''>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Orden</TableHead>
                                <TableHead>Comprador</TableHead>
                                <TableHead>Fecha de Compra</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Shipping Address</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Delivered</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewOrders.map((order)=>(
                                
                                <TableRow key={order.id}>
                                    <TableCell>
                                        {formatId(order.id)}
                                    </TableCell>
                                    <TableCell>
                                        {order?.user?.name ? order.user.name : 'Deleted User'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateTime(order.createdAt).dateOnly}
                                    </TableCell>
                                    <TableCell>
                                        {order?.shippingAddress?.shippingMethod}
                                    </TableCell>
                                    <TableCell className=''>
                                        {order?.shippingAddress?.shippingMethod ==='PICKUP' ? (order?.shippingAddress.storeName) : (`${order?.shippingAddress.address.streetName} ${order?.shippingAddress.address.city} ${order?.shippingAddress.address.postalCode}`) }
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(order.totalPrice.toNumber())}
                                    </TableCell>
                                    <TableCell>
                                        {order.isPaid ? ('Order has been paid') : ('Order has not been paid')}
                                    </TableCell>
                                    <TableCell>
                                        {order.isDelivered ? ('Order has been delivered') : ('Order has not been delivered')}
                                    </TableCell>
                                    
                                    <TableCell>
                                        <Button asChild variant='outline' size='sm'>
                                        <Link href={`/order/${order.id}`}>Details</Link>
                                        </Button>
                                        <DeleteDialog id={order.id} action={deleteOrder} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>  
                    </Table>
            {orders.totalPages > 1 && (
                <Pagination page={Number(page)} totalPages={orders?.totalPages}/>
            )}
        </div>
    </div>
  );
}
 
export default AdminOrdersPage;