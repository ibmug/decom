// file: app/user/orders/page.tsx

import { Metadata } from 'next'
import { getMyOrders } from '@/lib/actions/order.actions'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils/utils'
import Pagination from '@/components/shared/pagination'
import { PAGE_SIZE } from '@/lib/constants'

export const metadata: Metadata = { title: 'My Orders' }

type OrdersPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

type OrdersResponse = Awaited<ReturnType<typeof getMyOrders>>;
type OrderItem = OrdersResponse['data'][number];

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { page } = await searchParams
  const pageParam = Array.isArray(page) ? page[0] : page
  const pageNumber = pageParam ? Number(pageParam) : 1

  const { data: orderList, totalPages } = await getMyOrders({ userId: 'USER-ID-HERE', page: pageNumber, limit: PAGE_SIZE });

  if (!orderList || orderList.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-semibold mb-2">My Orders</h1>
        <p>You haven&apos;t placed any orders yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className='h2-bold'>Orders</h2>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.map((order: OrderItem) => (
              <TableRow key={order.id}>
                <TableCell>{formatId(order.id)}</TableCell>
                <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
                <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                <TableCell>{order.status === 'PENDING' ? 'Pending Pickup/Delivery' : order.status}</TableCell>
                <TableCell>
                  <a href={`/order/${order.id}`} className="text-blue-500 underline">
                    Order Details
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination page={Number(page) || 1} totalPages={totalPages} />
        )}
      </div>
    </div>
  )
}
