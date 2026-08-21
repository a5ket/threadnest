'use client'

import { Avatar } from '@/common/components/avatar'
import { ThemeOptions } from '@/common/components/theme-options'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface AccountMenuUser {
  username: string
  avatarUrl: string | null
}

interface AccountMenuProps {
  isSignedIn: boolean
  user: AccountMenuUser | null
  onSignOut: () => void
  signOutPending: boolean
}

export function AccountMenu({ isSignedIn, user, onSignOut, signOutPending }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={containerRef} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label={isSignedIn ? 'Account menu' : 'More options'}
        className='flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted'
      >
        {isSignedIn && user
          ? <Avatar avatarUrl={user.avatarUrl} label={user.username} size={28} />
          : (
              <svg viewBox='0 0 20 20' fill='currentColor' className='h-5 w-5 text-muted-foreground'>
                <circle cx='4' cy='10' r='1.5' />
                <circle cx='10' cy='10' r='1.5' />
                <circle cx='16' cy='10' r='1.5' />
              </svg>
            )}
      </button>

      {open && (
        <div className='absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg'>
          {isSignedIn && user && (
            <>
              <Link href={`/users/${user.username}`} onClick={close} className='block px-3 py-1.5 text-sm font-medium hover:bg-muted'>
                {user.username}
              </Link>
              <Link href='/me/profile' onClick={close} className='block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted'>
                Settings
              </Link>
              <div className='my-1 border-t border-border' />
            </>
          )}

          <div className='px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Theme</div>
          <ThemeOptions onSelect={close} />

          {isSignedIn && (
            <>
              <div className='my-1 border-t border-border' />
              <button
                type='button'
                onClick={() => {
                  close()
                  onSignOut()
                }}
                disabled={signOutPending}
                className='block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50'
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
