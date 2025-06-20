
'use client'

import { useState } from 'react'
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

const UserButton = ({closeMenu}:{closeMenu: (href:string)=> void}) => {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  if (status === 'loading') {
    return null
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
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200"
            onClick={() => setOpen(prev => !prev)}
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
          <DropdownMenuItem>
            <Link href='/user/profile' className='w-full' onClick={()=>closeMenu('/user/profile')} >
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href='/user/orders' className='w-full' onClick={()=>closeMenu('/user/orders')}>
              Order History
            </Link>
          </DropdownMenuItem>
          {session?.user.role === 'admin' && (
            <DropdownMenuItem>
              <Link href='/admin/dashboard' className='w-full' onClick={()=>closeMenu('/admin/dashboard')}>
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="p-0 mb-1">
            <form action={() => signOut({ callbackUrl: '/sign-out' })} className="w-full">
              <Button type="submit" className="w-full py-4 px-2 h-4 justify-start" variant="ghost">
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

