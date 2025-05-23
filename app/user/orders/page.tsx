import { Metadata } from 'next'
import { getMyOrders } from '@/lib/actions/order.actions'
import { Table,TableHead,TableBody,TableRow,TableHeader,TableCell } from '@/components/ui/table'
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils/utils'
import Pagination from '@/components/shared/pagination'

export const metadata: Metadata = {
  title: 'My Orders',
}

// Props type for the page component
type OrdersPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

// Infer the shape of a single order from the getMyOrders return type
type OrdersResponse = Awaited<ReturnType<typeof getMyOrders>>
type OrderItem = OrdersResponse['data'][number]

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  // Await the provided searchParams promise
  const { page } = await searchParams

  // Extract page param, default to 1
  const pageParam = Array.isArray(page) ? page[0] : page
  const pageNumber = pageParam ? Number(pageParam) : 1

  // Fetch orders for the current user (paginated response)
  const { data: orders, totalPages } = await getMyOrders({ page: pageNumber })

  // Render empty state if no orders
  if (!orders || orders.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-semibold mb-2">My Orders</h1>
        <p>You haven&apos;t placed any orders yet.</p>
      </div>
    )
  }

  // Render list of orders
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
                <TableHead>PAID</TableHead>
                <TableHead>DELIVERED</TableHead>
                <TableHead>ACTIONS</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {orders.map((order: OrderItem) => (
              <TableRow key={order.id}>
                <TableCell>{formatId(order.id)}</TableCell>
                <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
                <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                <TableCell>{order.isPaid ? `Paid at, ${order.paidAt}` : 'Not paid yet'}</TableCell>
                <TableCell>{order.isDelivered ? `Delivered on, ${order.deliveredAt}` : 'Not delivered yet'}</TableCell>
                <TableCell>
                  {/* Example action link; update path as needed */}
                  <a href={`/order/${order.id}`} className="text-blue-500 underline">
                    Order Details
                  </a>
                </TableCell>
              </TableRow>
            ))}
                </TableBody>
            </Table>
            {
                totalPages > 1 && (
                    <Pagination page={Number(page)|| 1} totalPages={orders?.totalPages}/>
                )}
        </div>
    </div>
  )
}
