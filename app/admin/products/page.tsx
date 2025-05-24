import Link from "next/link";
import { deleteProduct, getAllFilteredProducts } from "@/lib/actions/product.actions";
import { formatCurrency, formatId } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";
import { Product } from "@/types";
import SortSelector from "@/components/admin/sort-control";
import { SortOption } from "@/components/admin/sortselector.types";
import { PAGE_SIZE } from "@/lib/constants";


const productSortOptions: SortOption[] = [
    { value: 'id',       label: 'ID' },
    { value: 'name',     label: 'Name' },
    { value: 'price',    label: 'Price' },
    { value: 'category', label: 'Category' },
    { value: 'stock',    label: 'Stock' },
    { value: 'rating',   label: 'Rating' },
  ]


const AdminProductsPage = async (props: {
    searchParams: Promise<{
        page:string;
        query?:string;
        category?:string;
        orderby?: keyof Product;
        order?: 'asc'| 'desc'
    }>
}) => {
    const {
        page:   pageStr = "1",
        query    = "",
        category = "",
        orderby: ob = "createdAt",
        order    = "desc",
      } = await props.searchParams
      const page = Number(pageStr)

    const products = await getAllFilteredProducts({
        page,
        query,
        limit: PAGE_SIZE,
        category,
        orderBy: ob,
        order,
    })

    const viewProducts : Product[] = products.data.map((p)=>({
        ...p,
        price: p.price.toString(),
        rating: p.rating.toString(),
    }));

    return (<div className="space--y-2">
        
            <h1 className="h2-bold">Products</h1>
            <div className='overflow-x-auto'>
                        <div className="flex items-center justify-between">
                            <SortSelector options={productSortOptions} />
                            <Button asChild variant='default'>
                                <Link href='/admin/products/create'>Create Product</Link>
                            </Button>
                        </div>

        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead className='text-right'>PRICE</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>STOCK</TableHead>
                    <TableHead>RATING</TableHead>
                    <TableHead className='w-[100px]'>ACTIONS</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {viewProducts.map((product: Product)=>(
                    <TableRow key={product.id}>
                        <TableCell>{formatId(product.id)}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.rating}</TableCell>
                        <TableCell className='flex gap-1'>
                            <Button asChild variant='outline' size='sm'>
                                <Link href={`/admin/products/${product.id}`}>Edit</Link>
                            </Button>
                            <DeleteDialog id={product.id} action={deleteProduct}/>
                        </TableCell>

                    </TableRow>
                ))}
            </TableBody>
        </Table>
        
        {products?.totalPages && products.totalPages > 1 && (
            <Pagination page={page} totalPages = {products.totalPages} />
        )}
        </div>
    </div>  );
}
 
export default AdminProductsPage;