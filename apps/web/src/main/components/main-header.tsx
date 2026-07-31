import { useAuthOverlayStore } from '@/features/auth/auth-overlay.store'
import { useAuthSignOutHandler, useLogout } from '@/features/auth/auth.hooks'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { useRouter } from 'next/navigation'

export type AppHeaderProps = {
  onToggleSidebar?: () => void
}

export function MainHeader({ onToggleSidebar }: AppHeaderProps) {
  const router = useRouter()
  const isSignedIn = useIsSignedIn()
  const openAuthOverlay = useAuthOverlayStore((state) => state.open)
  const handleSignedOut = useAuthSignOutHandler(() => router.push('/'))
  const logout = useLogout({ onSuccess: handleSignedOut })

  return (
    <header className='bg-red-500 min-h-15'>
      <button onClick={onToggleSidebar} className='xl:hidden bg-yellow-400 p-2'>toggle</button>
      header
      {
        isSignedIn
          ? <button onClick={() => logout.mutate()} disabled={logout.isPending}>Sign Out</button>
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
