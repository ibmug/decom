'use server';
import { shippingAddressSchema, signInFormSchema, signUpFormSchema } from "../validators";
import { signIn,signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
//import { error } from "console";
import { ShippingAddress } from "@/types";
//import { shippingAddressDefaultValues } from "../constants";
import { auth } from "@/auth";
//Sign in the user with credentials

export async function signInWithCredentials(prevState:unknown, formData: FormData) {
    try{
        const user = signInFormSchema.parse({
            email:formData.get('email'),
            password:formData.get('password')
        })
        await signIn('credentials', user)
        return {success: true, message: 'Signed in succesfully'}

    } catch (err){
        if(isRedirectError(err)) {
            throw err;
        }
        return {success: false, message: 'Invalid Credentials'};
    }
}


//Sign user out

export async function signOutUser(){
    await signOut();
}


//Sign up user

export async function signUpUser(prevState:unknown, formData: FormData){
    try { 
        const user = signUpFormSchema.parse({
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
        });
        const somesalt = user.password;
        user.password = hashSync(user.password, 10)
        await prisma.user.create({
            data:{
                name: user.name,
                email: user.email,
                password: user.password,
            }
        });
    await signIn('credentials',{
        email:user.email,
        password:somesalt,

    });
    return {success:true, message: 'User registered succesfully'}

    } catch(err) {

        
        if(isRedirectError(err)){
            throw err;
        }
        return { success: false, message: formatError(err)}
    }
}

//get user by id

export async function getUserById(userId: string){
    const user = await prisma.user.findFirst({
        where: {id:userId}
    });
    if(!user){
        throw new Error ('user not found');
    }
    return user;
}

//update users Address

export async function updateUserAddress(data: ShippingAddress){
    try{
        const session = await auth();
        const currentUser = await prisma.user.findFirst({
            where:{id:session?.user?.id}
        });
        if(!currentUser) throw new Error('User not found');

        const address= shippingAddressSchema.parse(data);
        await prisma.user.update({
            where:{id: currentUser.id},
            data:{address}
        })

        return{success:true, message:"Address updated."}

    }catch(err){
        return {success: false, message: formatError(err)}
    }
}