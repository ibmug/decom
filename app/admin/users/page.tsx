import { Metadata } from "next";
import { deleteUser, getAllFilteredUsers } from "@/lib/actions/user.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";



import { PAGE_SIZE } from "@/lib/constants";
import { SortOption } from "@/components/admin/sortselector.types";
import SortSelector from "@/components/admin/sort-control";
import { User } from "@prisma/client";

const userSortOptions: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
  ]

//Grab full return type, extract the single-uyser item.
type UsersData = Awaited<ReturnType<typeof getAllFilteredUsers>>;
type RawUser = UsersData["data"][number];




export const metadata: Metadata = {
    title:'User Administration'
}


const UserAdminPage = async (props: {
    searchParams: Promise<{
        page:string;
        query?: string
        order?: 'asc' | 'desc'
        orderby?: keyof User
    }>
}) => {

    const {page='1', query='', order='asc', orderby='name'} = await props.searchParams;
    const users = await getAllFilteredUsers({page:Number(page), limit: PAGE_SIZE, query, order, orderBy: orderby})

    return ( 
        <div className="space-y-2">
        <h2 className="h2-bold">Users</h2>
        <div className="overflow-x-auto">
        <div className="flex items-center justify-between">
        <SortSelector options={userSortOptions} />
        </div>
  
       
                    <Table className=''>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>NAME</TableHead>
                                <TableHead>EMAIL</TableHead>
                                <TableHead>ROLE</TableHead>
                                <TableHead>ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((user: RawUser)=>(
                                
                                <TableRow key={user.id}>
                                    <TableCell>
                                        {formatId(user.id)}
                                    </TableCell>
                                    <TableCell>
                                        {user?.name ? user.name : 'Deleted User'}
                                    </TableCell>
                                    <TableCell>
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        {user.role === 'user' ? (<Badge variant='secondary'>User</Badge>) : (<Badge variant='default'>Admin</Badge>)}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild variant='outline' size='sm'>
                                        <Link href={`/admin/users/${user.id}`}>Details</Link>
                                        </Button>
                                        <DeleteDialog id={user.id} action={deleteUser} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>  
                    </Table>
            {users.totalPages > 1 && (
                <Pagination page={Number(page)} totalPages={users?.totalPages}/>
            )}
        </div>
    </div>
     );
}
 
export default UserAdminPage;