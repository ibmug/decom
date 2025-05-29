import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllCats } from "@/lib/actions/product.actions";
import { SearchIcon } from "lucide-react";

const ProductSearch = async () => {
    const cats = await getAllCats();
    const categories = cats ?? []

    return (<>
    <form action="/search" method="GET">
    <div className="flex flex-wrap w-full  items-center space-x-2">
        <div className='hidden md:block'>
        <Select name='category'>
            <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
                <SelectItem key='All' value="all">All</SelectItem>
                {categories.map((x:{category:string})=>(<SelectItem key={x.category} value={x.category}>{x.category}</SelectItem>))}
            </SelectContent>
        </Select>
        
        </div>
        <Input name='q' type='text' placeholder='Search a product...' className='w-full md:w-[100px] lg:w-[300px]'/>
        <Button className='hidden md:block'><SearchIcon/></Button>
    </div>
    </form>
    </>  );
}
 
export default ProductSearch; 