'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChatList } from './chat-list'
import { ChatPanel } from './chat-panel'

interface ChatModalProps {
  onClose: () => void
}

export function ChatModal({ onClose }: ChatModalProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4' onClick={onClose}>
      <div
        className='flex h-full w-full flex-col overflow-hidden border-border bg-background shadow-lg sm:h-[600px] sm:max-w-md sm:rounded-lg sm:border'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between gap-3 border-b border-border p-3'>
          <span className='text-sm font-semibold'>Chats</span>

          <div className='flex items-center gap-3'>
            <Link
              href={selectedChatId ? `/chats/${selectedChatId}` : '/chats'}
              onClick={onClose}
              className='text-xs text-muted-foreground hover:underline'
            >
              Open full page
            </Link>

            <button type='button' onClick={onClose} aria-label='Close' className='rounded-md p-1 hover:bg-muted'>
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                <path d='M5 5l10 10M15 5L5 15' strokeLinecap='round' />
              </svg>
            </button>
          </div>
        </div>

        <div className='min-h-0 flex-1'>
          {selectedChatId
            ? <ChatPanel chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />
            : <ChatList onSelectChat={setSelectedChatId} />}
        </div>
      </div>
    </div>
  )
}
