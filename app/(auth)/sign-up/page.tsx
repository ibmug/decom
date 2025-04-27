import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { Metadata } from 'next';
  import Link from 'next/link';
  import Image from 'next/image';
  import { APP_NAME } from '@/lib/constants';
  import { redirect } from 'next/navigation';
  import SignUpForm from './sign-up-form';
  import { getServerSession } from 'next-auth/next';
  import { authOptions }      from '@/lib/authOptions';
  
  export const metadata: Metadata = {
    title: 'Sign Up',
  };
  
  const SignUpPage = async () => {
    const session = await getServerSession(authOptions)
    if (session) redirect('/');
  
  
    return (
      <div className='w-full max-w-md mx-auto'>
        <Card>
          <CardHeader className='space-y-4'>
            <Link href='/' className='flex-center'>
              <Image
                src='/images/logo.svg'
                width={100}
                height={100}
                alt={`${APP_NAME} logo`}
                priority={true}
              />
            </Link>
            <CardTitle className='text-center'>Create Account</CardTitle>
            <CardDescription className='text-center'>
              Enter your information below to sign up
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default SignUpPage;