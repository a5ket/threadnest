'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface ManageLink {
  href: string
  label: string
}

interface NestManageNavProps {
  links: ManageLink[]
}

export function NestManageNav({ links }: NestManageNavProps) {
  const pathname = usePathname()

  return (
    <nav className='flex flex-col gap-0.5'>
      {links.map((link) => {
        const active = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
