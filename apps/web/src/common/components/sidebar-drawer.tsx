'use client'

import { PropsWithChildren } from 'react'

export type SidebarDrawerProps = PropsWithChildren<{
  open: boolean
}>

export function SidebarDrawer({
  open,
  children
}: SidebarDrawerProps) {
  if (!open) {
    return null
  }

  return (
    <div className='absolute inset-0 z-50 xl:hidden'>
      <aside className='relative h-full w-64 border-r bg-background shadow-xl'>
        {children}
      </aside>
    </div>
  )
}
