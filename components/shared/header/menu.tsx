'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
import Link from "next/link";
import { EllipsisVertical, ShoppingCart } from "lucide-react";
import {
  SheetContent, Sheet, SheetTrigger, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import UserButton from "./user-button";
import { useCloseOnNavigate } from "@/lib/hooks/useCloseOnNavigate";

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
    const handleNavigate = useCloseOnNavigate(setIsOpen)
  return (
    <div className="flex justify-end gap-3">
      <nav className="hidden md:flex w-full max-w-xs gap-1">
        <ModeToggle />
        <Button asChild variant="ghost">
          <Link href="/cart" onClick={()=> setIsOpen(false)}>
            <ShoppingCart /> Cart
          </Link>
        </Button>
        <UserButton closeMenu={handleNavigate} />
      </nav>

      <nav className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="align-middle" onClick={()=> handleNavigate('/cart')}>
              <EllipsisVertical />
            </button>
          </SheetTrigger>

          <SheetContent className="flex flex-col items-start">
            <SheetTitle>Menu</SheetTitle>

            <ModeToggle />
            <Button asChild variant="ghost">
              <Link href="/cart" onClick={()=> handleNavigate('/cart')}>
                <ShoppingCart /> Cart
              </Link>
            </Button>
            <UserButton closeMenu={handleNavigate}/>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
