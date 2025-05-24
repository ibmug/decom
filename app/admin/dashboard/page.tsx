import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderSummary } from '@/lib/actions/order.actions';
//import { authOptions } from '@/lib/authOptions';
import { BadgeDollarSign, BarcodeIcon, CreditCardIcon, Users } from 'lucide-react';
import {Metadata} from 'next';
//import { getServerSession } from 'next-auth';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import Charts from './charts';
import type { GetOrderSummaryReturn } from '@/lib/actions/order.actions';

type Summary = Awaited<GetOrderSummaryReturn>
type LatestOrder = Summary['latestSales'][number]

export const metadata: Metadata = {
    title: 'Vista de Administrador'
}


const AdminDashboardPage = async () => {


    const summary = await getOrderSummary();

    return (
    <div className="space-y-2">
        <h1 className="h2-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Rev</CardTitle>
                    <BadgeDollarSign/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                       {formatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0)} 
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Sales</CardTitle>
                    <CreditCardIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                       {formatNumber(summary.ordersCount)} 
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Customers</CardTitle>
                    <Users/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                       {formatNumber(summary.usersCount)} 
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Products</CardTitle>
                    <BarcodeIcon/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                       {formatNumber(summary.productsCount)} 
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className='col-span-4'>
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <Charts data={{salesData: summary.salesData}}/>
                </CardContent>
            </Card>
            <Card className='col-span-3'>
                <CardHeader>
                    <CardTitle>Ultimas Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Comprador</TableHead>
                                <TableHead>Fecha de Compra</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.latestSales.map((order: LatestOrder)=>(
                                <TableRow key={order.id}>
                                    <TableCell>
                                        {order?.user?.name ? order.user.name : 'Deleted User'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateTime(order.createdAt).dateOnly}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(order.totalPrice.toNumber())}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/order/${order.id}`}>
                                        <span className="px-2">Details</span>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>  
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
    );
} 
export default AdminDashboardPage;