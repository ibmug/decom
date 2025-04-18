'use client';
import { Cart, CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import {useRouter} from 'next/navigation'
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { Plus,Minus,Loader } from "lucide-react";
import {useTransition} from 'react'
//takes props with item and for the type is item to CartItem.
const AddToCart = ({cart, item}: {cart?: Cart, item:CartItem}) => {
    const router = useRouter();
    const {toast}= useToast();
    const [isPending, startTransition] = useTransition();

    const handleAddToCart = async () =>{
        startTransition(async ()=>{

            const res = await addItemToCart(item);
            if(!res.success){
                toast({
                    variant:'destructive',
                    description: res.message
                });
                return;
            }
    
            //Handle successful addition
            toast({
                //description: `${item.name} added to cart.`,
                description: res.message,
                action: (
                    <ToastAction className='bg-primary text-white hover:bg-gray-800' altText='Go To Cart' onClick={()=>{router.push('/cart')}}> Go to Cart!</ToastAction>
                )
            })

        });
       
    };

    const handleRemoveFromCart = async () => {

        startTransition(async ()=>{
            const res = await removeItemFromCart(item.productId);
        toast({
            variant:res.success ? 'default':'destructive',
            description: res.message
        })
        return;
        });
    };
    //Chek if item is in cart.
    const itemExists = cart && cart.items.find((x)=>x.productId === item.productId)

    console.log(itemExists)

    return itemExists ? (
       <div>
        <Button type='button' onClick={handleRemoveFromCart}>{isPending ? (<Loader className='h-4 w-4 animate-spin'/>) : (<Minus className='h-4 w-4'/>)} </Button>
       <span className="px-2">{itemExists.qty}</span>
       <Button type='button' onClick={handleAddToCart}>{isPending ? (<Loader className='h-4 w-4 animate-spin'/>) : (<Plus className='h-4 w-4'/>) }</Button>
       </div>
      ) :(
        <div><Button className='w-full' type='button' onClick={handleAddToCart}><Plus/> Add to Cart!</Button></div>
      );
}

export default AddToCart;