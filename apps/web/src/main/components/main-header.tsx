import { Avatar } from '@/common/components/avatar'
import { useAuthOverlayStore } from '@/features/auth/auth-overlay.store'
import { useAuthSignOutHandler, useLogout } from '@/features/auth/auth.hooks'
import { useIsSignedIn, useUser } from '@/features/me/me.hooks'
import { SearchBar } from '@/features/search/components/search-bar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type AppHeaderProps = {
  onToggleSidebar?: () => void
}

export function MainHeader({ onToggleSidebar }: AppHeaderProps) {
  const router = useRouter()
  const isSignedIn = useIsSignedIn()
  const user = useUser()
  const openAuthOverlay = useAuthOverlayStore((state) => state.open)
  const handleSignedOut = useAuthSignOutHandler(() => router.push('/'))
  const logout = useLogout({ onSuccess: handleSignedOut })

  return (
    <header className='flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3'>
      <button
        onClick={onToggleSidebar}
        aria-label='Toggle sidebar'
        className='rounded-md p-2 hover:bg-muted xl:hidden'
      >
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-5 w-5'>
          <path d='M3 5h14M3 10h14M3 15h14' strokeLinecap='round' />
        </svg>
      </button>

      <Link href='/' className='shrink-0 text-lg font-semibold text-foreground'>
        ThreadNest
      </Link>

      <div className='flex flex-1 justify-center'>
        <SearchBar />
      </div>

      <div className='flex shrink-0 items-center gap-3'>
        {isSignedIn
          ? (
              <>
                {user && (
                  <Link href={`/users/${user.username}`} className='flex items-center gap-2 hover:opacity-80'>
                    <Avatar avatarUrl={user.avatarUrl} label={user.username} size={28} />
                    <span className='hidden text-sm font-medium sm:inline'>{user.username}</span>
                  </Link>
                )}

                <Link href='/me/security' className='hidden text-sm text-muted-foreground hover:underline sm:inline'>
                  Security
                </Link>

                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
                >
                  Sign Out
                </button>
              </>
            )
          : (
              <>
                <button
                  onClick={() => openAuthOverlay('login')}
                  className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
                >
                  Sign In
                </button>

                <button
                  onClick={() => openAuthOverlay('register')}
                  className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
                >
                  Sign Up
                </button>
              </>
            )}
      </div>
    </header>
  )
}
