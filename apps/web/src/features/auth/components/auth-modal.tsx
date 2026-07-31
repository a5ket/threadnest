'use client'

import { PropsWithChildren } from 'react'

interface AuthModalProps extends PropsWithChildren {
  onClose: () => void
}

export function AuthModal({ children, onClose }: AuthModalProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
      <div className='rounded-lg border border-border bg-background p-6 shadow-lg' onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
