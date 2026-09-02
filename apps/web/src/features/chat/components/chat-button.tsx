'use client'

import { useState } from 'react'
import { useChatUnreadCount } from '../chat.hooks'
import { ChatModal } from './chat-modal'

export function ChatButton() {
  const [open, setOpen] = useState(false)
  const { data: unreadCount } = useChatUnreadCount()

  const count = unreadCount ?? 0

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='Chats'
        className='relative rounded-md p-2 hover:bg-muted'
      >
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
          <path d='M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v6A1.5 1.5 0 0 1 15.5 13H9l-4 3v-3H4.5A1.5 1.5 0 0 1 3 11.5v-6Z' strokeLinejoin='round' />
        </svg>

        {count > 0 && (
          <span className='absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground'>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && <ChatModal onClose={() => setOpen(false)} />}
    </>
  )
}
