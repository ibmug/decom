'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { UserIcon } from 'lucide-react'

const UserButton = () => {
  const { data: session, status } = useSession()
  console.log('[SESSION]', status, session)

  if (status === 'loading') {
    return null // or a skeleton loader
  }

  if (!session?.user) {
    return (
      <Button asChild>
        <Link href="/sign-in">
          <UserIcon className="mr-1" /> Sign In
        </Link>
      </Button>
    )
  }

  const { name, email } = session.user
  const firstInitial = name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200"
          >
            {firstInitial}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-medium leading-none">{name}</div>
              <div className="text-sm font-medium text-muted-foreground leading-none">
                {email}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem className="p-0 mb-1">
            <form
              action={() => signOut({ callbackUrl: '/' })}
              className="w-full"
            >
              <Button
                type="submit"
                className="w-full py-4 px-2 h-4 justify-start"
                variant="ghost"
              >
                Sign out!
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserButton
