'use client'
import { useState, useEffect }       from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn }                     from 'next-auth/react'
import { useActionState }             from 'react'
import { useToast }                   from '@/hooks/use-toast'
import { signUpUser }                 from '@/lib/actions/user.actions'
import { Button }                     from '@/components/ui/button'
import { Input }                      from '@/components/ui/input'
import { Label }                      from '@/components/ui/label'

export default function SignUpForm() {
  const router      = useRouter()
  const toast       = useToast().toast
  const params      = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'

  // ← Track email & password so we can pass them to signIn()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // actionState will capture the result of your server action
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  })

  // Once the signup action returns success, run client‐side signIn()
  useEffect(() => {
    if (data.success) {
      signIn('credentials', { email, password, redirect: false })
        .then((res) => {
          if (res?.ok) {
            router.push(callbackUrl)
          } else {
            toast({
              variant: 'destructive',
              description: 'Sign in failed. Please try again.',
            })
          }
        })
    }
  }, [data.success, email, password, callbackUrl, router, toast])

  return (
    <form action={action}>
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" type="text" required />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>

        <div>
          <Button type="submit" className="w-full">
            {data.success ? 'Signing in…' : 'Sign Up'}
          </Button>
        </div>

        {data && !data.success && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <a href="/sign-in" className="link">
            Sign in
          </a>
        </div>
      </div>
    </form>
  )
}
