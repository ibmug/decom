import { Metadata } from "next";
import { getorderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import OrderDetailsCard from "./order-details-card";
import { ShippingAddress } from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


export const dynamic = 'force-dynamic'
export const metadata: Metadata= {
    title: 'Order Details'
};


const OrderDetailsPage = async  (props: {
    params: Promise<{id: string}>
}) => {
    const {id} = await props.params

    const session = await getServerSession(authOptions)

    const order = await getorderById(id);
    if(!order) notFound();

    return (<OrderDetailsCard order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress
    }} paypalClientId={process.env.PAYPAL_CLIENT_ID ||'sb' } isAdmin={session?.user?.role==='admin' || false}/>  );
}
 
export default OrderDetailsPage;