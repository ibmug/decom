'use server'; //server action

import { CartItem } from "@/types";

export async function addItemToCart(data: CartItem){
    return {success: true, message: "Item Added to Cart."};
}