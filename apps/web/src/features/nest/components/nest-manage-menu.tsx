'use client'

import { ModeratorIcon } from '@/common/components/authority-icons'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface ManageLink {
  href: string
  label: string
}

interface NestManageMenuProps {
  links: ManageLink[]
}

export function NestManageMenu({ links }: NestManageMenuProps) {
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

  if (links.length === 0) return null

  return (
    <div ref={containerRef} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex items-center gap-1.5 rounded-md border border-moderator/40 px-3 py-2 text-sm font-medium text-moderator hover:bg-moderator/10'
      >
        <ModeratorIcon />
        Manage
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
          <path d='M5 8l5 5 5-5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>

      {open && (
        <div className='absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg'>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className='block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
