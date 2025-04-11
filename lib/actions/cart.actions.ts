'use server'; //server action

import { CartItem } from "@/types";

export async function addItemToCart(data: CartItem){
    console.log(data)
    return {success: true, message: "Item Added to Cart."};
}