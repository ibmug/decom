'use client'


import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import { signIn } from 'next-auth/react'
import {useState} from "react"

export default function CredentialsSignInForm({initCallbackUrl}:{initCallbackUrl:string}) {
  const router = useRouter()
  //const searchParams = useSearchParams()
  //const callbackUrl = searchParams.get('callbackUrl') ?? initCallbackUrl
  const callbackUrl = initCallbackUrl ?? '/'
  

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      //redirect: false,
      email,
      password,
      callbackUrl,
    })
    
    if (res?.error) {
      setError('Invalid email or password.')
    } else if (res?.url){
      router.push(res.url)
    } else{
      console.log("Fallback should never happen...")
      router.push(initCallbackUrl)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
  Don&apos;t have an account?{' '}
  <Link href="/sign-up" className="text-primary underline">Sign up</Link>
</p>

    </form>
  )
}
