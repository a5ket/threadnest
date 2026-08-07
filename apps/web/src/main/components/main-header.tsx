import { useAuthOverlayStore } from '@/features/auth/auth-overlay.store'
import { useAuthSignOutHandler, useLogout } from '@/features/auth/auth.hooks'
import { useIsSignedIn, useUser } from '@/features/me/me.hooks'
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
  console.log(user)

  return (
    <header className='bg-red-500 min-h-15'>
      <button onClick={onToggleSidebar} className='xl:hidden bg-yellow-400 p-2'>toggle</button>
      header
      {
        isSignedIn
          ? (
              <>
                <br />
                {user && <Link href={`/users/${user.username}`}>My profile</Link>}
                <Link href='/me/security'>Account security</Link>
                <button onClick={() => logout.mutate()} disabled={logout.isPending}>Sign Out</button>
                <div>
                  Veirifed:
                  {user?.emailVerified ? 'true' : 'false'}
                </div>
              </>
            )
          : (
              <>
                <button onClick={() => openAuthOverlay('login')}>Sign In</button>
                <button onClick={() => openAuthOverlay('register')}>Sign Up</button>
              </>
            )
      }
    </header>
  )
}
