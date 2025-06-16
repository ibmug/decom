import { getAllFilteredOrders } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";
import { shippingAddressSchema } from "@/lib/validators";
import { z } from 'zod';
import { SortOption } from "@/components/admin/sortselector.types";
import SortSelector from "@/components/admin/sort-control";

// --- Sorting definitions (future proofing, not used right now)
const orderSortOptions: SortOption[] = [
  { value: "createdAt", label: "Date" },
  { value: "totalPrice", label: "Total Price" },
  { value: "status", label: "Status" },
];

// --- Infer schema types from zod validator
type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// --- Final type returned by getAllFilteredOrders()
type OrdersData = Awaited<ReturnType<typeof getAllFilteredOrders>>;
type RawOrder = OrdersData['orders'][number];

type ViewOrder = Omit<RawOrder, "shippingAddress"> & {
  shippingAddress: ShippingAddress;
};

export const metadata: Metadata = {
  title: 'Admin Orders',
};

const AdminOrdersPage = async (props: {
  searchParams: Promise<{
    page?: string;
  }>;
}) => {
  const { page: pageStr = '1' } = await props.searchParams;
  const page = Number(pageStr);

  const orders = await getAllFilteredOrders({
    page,
    pageSize: 10,
    status: undefined, // default: fetch all orders
  });

  const viewOrders: ViewOrder[] = orders.orders.flatMap((order) => {
    if (!order.shippingAddress) {
      console.warn(`Skipping order ${order.id} due to missing shippingAddress`);
      return [];
    }

    try {
      const sa = shippingAddressSchema.parse({
        ...(order.shippingAddress as object),
        shippingMethod: order.shippingMethod,
      });

      return [{ ...order, shippingAddress: sa }];
    } catch (err) {
      console.warn(`Skipping order ${order.id} due to invalid schema`, err);
      return [];
    }
  });

  return (
    <div className="space-y-2">
      <h2 className="h2-bold">Orders</h2>
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between">
          <SortSelector options={orderSortOptions} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Fecha de Compra</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Shipping Address</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{formatId(order.id)}</TableCell>
                <TableCell>{order.user?.name || 'Deleted User'}</TableCell>
                <TableCell>{formatDateTime(order.createdAt).dateOnly}</TableCell>
                <TableCell>{order.shippingAddress?.shippingMethod}</TableCell>
                <TableCell>
                  {order.shippingAddress.shippingMethod === 'PICKUP'
                    ? order.shippingAddress.addressName
                    : `${order.shippingAddress.address.streetName} ${order.shippingAddress.address.city} ${order.shippingAddress.address.postalCode}`}
                </TableCell>
                <TableCell>{formatCurrency(order.totalPrice.toString())}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/order/${order.id}`}>Details</Link>
                  </Button>
                  <DeleteDialog id={order.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
