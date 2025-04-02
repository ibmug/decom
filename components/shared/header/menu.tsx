import {Button} from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
import Link from "next/link";
import {EllipsisVertical, ShoppingCart, UserIcon} from "lucide-react"
import { SheetContent,Sheet, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const  Menu = () => {
    return (  
        <div className="flex justify-end gap-3">
            <nav className="hidden md:flex w-full max-w-xs gap-1">
            <div className="space-x-2">
                <ModeToggle/>
            <Button asChild variant='ghost'>
                <Link href='/cart'>
                <ShoppingCart /> Cart
                </Link>
            </Button>
            <Button asChild>
                <Link href='/sign-in'>
                <UserIcon /> Login
                </Link>
            </Button>
            </div>
            </nav>
            <nav className="md:hidden">
                <Sheet>
                    <SheetTrigger className='align-middle'>
                    <EllipsisVertical />
                    <SheetContent className='flex flex-col items-start'>
                        <SheetTitle>Menu</SheetTitle>
                        <ModeToggle/>
                        <Button asChild variant='ghost'>
                             <Link href='/cart'>
                            <ShoppingCart /> Cart
                             </Link>
                        </Button>
                        <Button asChild>
                         <Link href='/sign-in'>
                        <UserIcon /> Login
                        </Link>
                        </Button>
                        <SheetDescription></SheetDescription>
                    </SheetContent>
                    </SheetTrigger>
                </Sheet>
            </nav>
        </div>
    );
}
 
export default Menu;