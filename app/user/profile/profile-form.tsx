'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { updateProfileSchema } from '@/lib/validators'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/lib/actions/user.actions'
import { z } from 'zod'

export default function ProfileForm() {
  // 1) Hooks always run in this order
  const { data: session, update: updateSession, status } = useSession()
  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', email: '' },
  })
  const { toast } = useToast()

  // 2) Hydrate/reset once session arrives
  useEffect(() => {
    if (session) {
      form.reset({
        name: session.user.name ?? '',
        email: session.user.email ?? '',
      })
    }
  }, [session, form])

  // 3) Now gates for rendering
  if (status === 'loading') {
    return <p>Loading…</p>
  }
  if (!session) {
    return <p>Please sign in to edit your profile.</p>
  }

  // 4) Submit handler
  const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    const res = await updateProfile(values)
    if (!res.success) {
      return toast({ variant: 'destructive', description: res.message })
    }

    // update NextAuth context
    await updateSession({ user: { name: values.name } })
    toast({ description: res.message })
  }

  // 5) Final render
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input disabled placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting…' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  )
}
