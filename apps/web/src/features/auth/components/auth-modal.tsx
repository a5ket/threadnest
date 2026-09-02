'use client'

import { PropsWithChildren } from 'react'

interface AuthModalProps extends PropsWithChildren {
  onClose: () => void
}

export function AuthModal({ children, onClose }: AuthModalProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={onClose}>
      <div
        className='relative w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg'
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type='button'
          onClick={onClose}
          aria-label='Close'
          className='absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
        >
          <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
            <path d='M5 5l10 10M15 5L5 15' strokeLinecap='round' />
          </svg>
        </button>

        {children}
      </div>
    </div>
  )
}
