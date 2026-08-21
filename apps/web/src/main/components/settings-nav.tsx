'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const SECTIONS = [
  { href: '/me/profile', label: 'Profile' },
  { href: '/me/security', label: 'Security' },
  { href: '/me/notifications', label: 'Notifications' },
  { href: '/me/blocks', label: 'Blocked users' },
  { href: '/me/saved', label: 'Saved' }
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className='flex flex-col gap-0.5'>
      {SECTIONS.map((section) => {
        const active = pathname === section.href

        return (
          <Link
            key={section.href}
            href={section.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
