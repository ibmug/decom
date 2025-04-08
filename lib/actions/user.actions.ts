'use server';
import { signInFormSchema, signUpFormSchema } from "../validators";
import { signIn,signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";

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
        console.log(err);
        return { success: false, message: 'Unexpected problem'}
    }
}