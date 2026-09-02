'use client'

import { PropsWithChildren } from 'react'

export type SidebarDrawerProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
}>

export function SidebarDrawer({
  open,
  onClose,
  children
}: SidebarDrawerProps) {
  if (!open) {
    return null
  }

  return (
    <div className='absolute inset-0 z-50 xl:hidden'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />

      <aside className='relative h-full w-64 border-r border-border bg-canvas shadow-xl'>
        {children}
      </aside>
    </div>
  )
}
