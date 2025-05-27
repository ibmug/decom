import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { getAllCats } from "@/lib/actions/product.actions";
import { MenuIcon } from "lucide-react";
import Link from "next/link";

const CategoryDrawer = async () => {

    const categories = await getAllCats();

    return (<Drawer direction='left'>
        <DrawerTrigger asChild>
            <Button variant='outline'>
                <MenuIcon/>
            </Button>
        </DrawerTrigger>
        <DrawerContent className='h-full max-w-sm'>
            <DrawerHeader>
                <DrawerTitle>Filters:</DrawerTitle>
                <div className="space-y-1 mt-2">
                    {categories ? categories.map((x:{category:string, _count:number})=> (
                        <Button variant='ghost' className='w-full justify-start' key={x.category} asChild>
                            <DrawerClose asChild>
                                {/* <Link href={`/search?category=${x.category}`}> */}
                                <Link href={`/search?category=${encodeURIComponent(x.category)}`}>
                                {x.category}({x._count})
                                </Link>
                            </DrawerClose>
                        </Button>
                    )) : (<>Filters for search, coming soon.</>)}
                </div>
            </DrawerHeader>
        </DrawerContent>
    </Drawer> );
}
 
export default CategoryDrawer;