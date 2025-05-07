import { NextResponse } from "next/server";


export async function GET(){
    //remove the sessionCarId cookie
    const res = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL))
    res.cookies.delete('sessionCartId')
    return res
}