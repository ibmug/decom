'use client';
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import {useRouter} from 'next/navigation'
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { addItemToCart } from "@/lib/actions/cart.actions";
//takes props with item and for the type is item to CartItem.
const AddToCart = ({item}: {item:CartItem}) => {
    const router = useRouter();
    const {toast}= useToast();

    const handleAddToCart = async () =>{
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
            description: `${item.name} added to cart.`,
            action: (
                <ToastAction className='bg-primary text-white hover:bg-gray-800' altText='Go To Cart' onClick={()=>{router.push('/cart')}}> Go to Cart!</ToastAction>
            )
        })
    }
    return (
        <Button className='w-full' type='button' onClick={handleAddToCart}>Add to Cart!</Button>
      );
}

export default AddToCart;