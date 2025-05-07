import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { Metadata } from "next";
import Image from "next/image";
import CredentialsSignInForm from "./credentials-signin-form";
//import {getCsrfToken} from 'next-auth/react';;

export const metadata: Metadata = {
  title: 'Sign In',
};

type Props = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>
};

export default async function SignInPage({searchParams}: Props) {
   // 1) raw from URL
  const {callbackUrl:raw} = await searchParams
   // 2) only allow relative paths (prevents open-redirects)
  const callbackUrl = raw && raw.startsWith('/') ? raw : '/'
 
   
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex-center">
            <Image
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className="text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign into your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CredentialsSignInForm initCallbackUrl={callbackUrl}/>
        </CardContent>
      </Card>
    </div>
  );
}
