import { Metadata } from "next";
import { getMyOrders } from "@/lib/actions/order.actions";
//import { formatCurrency,formatDateTime,formadId } from "@/lib/utils";
//import Link from "next/link"


export const metadata: Metadata={
    title:"My Orders"
}

type Props = {
    searchParams:Promise <{page: string}>
};

export default async function OrdersPage({searchParams}:Props){
    const {page} = await searchParams;
    if(!page){throw new Error('Nothing on cart')}
    const orders = await getMyOrders({
        page:Number(page) || 1
    });
    console.log(orders)
    return ( <>Orders</> );
}
 
//export default OrdersPage;