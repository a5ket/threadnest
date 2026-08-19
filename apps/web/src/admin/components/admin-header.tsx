'use client'

import { useAuthSignOutHandler, useLogout } from '@/features/auth/auth.hooks'
import { useUser } from '@/features/me/me.hooks'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function AdminHeader() {
  const router = useRouter()
  const user = useUser()
  const handleSignedOut = useAuthSignOutHandler(() => router.push('/'))
  const logout = useLogout({ onSuccess: handleSignedOut })

  return (
    <header className='flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4'>
      <Link href='/admin' className='shrink-0 text-lg font-semibold text-foreground'>
        ThreadNest Admin
      </Link>

      <nav className='flex flex-1 items-center gap-4 text-sm'>
        <Link href='/admin' className='text-muted-foreground hover:text-foreground hover:underline'>
          Reports
        </Link>

        <Link href='/admin/action-logs' className='text-muted-foreground hover:text-foreground hover:underline'>
          Action Log
        </Link>
      </nav>

      <div className='flex shrink-0 items-center gap-3'>
        <Link href='/' className='text-sm text-muted-foreground hover:underline'>
          Back to app
        </Link>

        {user && (
          <span className='hidden text-sm text-muted-foreground sm:inline'>{user.username}</span>
        )}

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
