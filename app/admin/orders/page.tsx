
//import { getServerSession } from "next-auth";
//import { authOptions } from "@/lib/authOptions";
import { deleteOrder, getAllFilteredOrders } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime,formatId } from "@/lib/utils/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";
import { shippingAddressSchema } from "@/lib/validators";
import {z} from 'zod'
import { SortOption } from "@/components/admin/sortselector.types";
import { Order} from "@prisma/client"
import SortSelector from "@/components/admin/sort-control";
// Pull in the real return type of your fetch helper
type OrdersData = Awaited<ReturnType<typeof getAllFilteredOrders>>;

//  Extract the single‐item type from the `data` array
//    (if getAllFilteredOrders returns `{ data: T[]; totalPages: number }`)
type RawOrder = OrdersData["data"][number];

// Infer the parsed address shape from your Zod schema
type ShippingAddress = z.infer<typeof shippingAddressSchema>;

//  Build the “view” type you actually render
type ViewOrder = Omit<RawOrder, "shippingAddress"> & {
  shippingAddress: ShippingAddress;
};

///Sort Filters

// 1) Define the fields you can sort by
const orderSortOptions: SortOption[] = [
    { value: "createdAt",   label: "Date"            },
    { value: "totalPrice",  label: "Total Price"    },
    { value: "isPaid",      label: "Paid Status"    },
    { value: "isDelivered", label: "Delivery Status"},
  ]

 // Create a literal union type of those values:
const ALLOWED_ORDER_FIELDS = [
  "createdAt",
  "totalPrice",
  "isPaid",
  "isDelivered",
] as const;
type AllowedOrderField = typeof ALLOWED_ORDER_FIELDS[number];



export const metadata : Metadata = {
    title: 'Admin Orders',
}



const AdminOrdersPage = async (props: {
    searchParams: Promise<{
        page?: string
        query?: string
        orderby?: keyof Order
        order?: 'asc' | 'desc'
    }>
}) => {
    const {page:pageStr = '1', query='', orderby:rawOrderBy = 'createdAt',order: rawOrder ='desc'} = await props.searchParams;
    
    const page = Number(pageStr)




    // const orders = await getAllFilteredOrders({
    //     page: Number(page),
    //     limit: 10,
    //     query,
    //     //orderBy: orderby,
    //     orderby?: string;
    //     order,
    // });

       // 2) Narrow and validate the `orderby` field:
  const orderByField: AllowedOrderField = ALLOWED_ORDER_FIELDS.includes(
     rawOrderBy as AllowedOrderField
   )
     ? (rawOrderBy as AllowedOrderField)
     : 'createdAt';
   // 3) Ensure `order` is 'asc' | 'desc'
   const orderDir = rawOrder === 'asc' ? 'asc' : 'desc';
   const orders = await getAllFilteredOrders({
     page,
     limit: 10,
     query,
     orderBy: orderByField,
     order:   orderDir,
   });

    //console.log(orders.data[0])
    const viewOrders: ViewOrder[] = orders.data.map((order: RawOrder) => {
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
            <div className="flex items-center justify-between">
                <SortSelector options={orderSortOptions} />
            </div>
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
                                        {formatCurrency(order.totalPrice.toString())}
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