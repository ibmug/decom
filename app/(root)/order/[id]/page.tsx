import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import OrderDetailsCard from "./order-details-card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Details',
};

// ✅ FIX: no need for a custom interface unless reused
const OrderDetailsPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  const session = await getServerSession(authOptions);
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <OrderDetailsCard
      order={order}
      paypalClientId={process.env.PAYPAL_CLIENT_ID ?? "sb"}
      isAdmin={session?.user?.role === "admin"}
    />
  );
};

export default OrderDetailsPage;
