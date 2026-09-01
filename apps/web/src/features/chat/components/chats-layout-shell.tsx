'use client'

import { useHideRightRail } from '@/common/components/right-rail-context'
import { useParams, useRouter } from 'next/navigation'
import type { ChatListPage } from '../chat.server'
import { ChatList } from './chat-list'

interface ChatsLayoutShellProps {
  initialPage: ChatListPage
  children: React.ReactNode
}

// A chat open (chatId param present) and the list are shown side by side once there's room;
// below that breakpoint only one of the two panes is visible at a time.
export function ChatsLayoutShell({ initialPage, children }: ChatsLayoutShellProps) {
  const router = useRouter()
  const { chatId } = useParams<{ chatId?: string }>()

  useHideRightRail()

  return (
    <div className='flex h-full min-h-0'>
      <div className={`${chatId ? 'hidden lg:flex' : 'flex'} h-full w-full shrink-0 flex-col overflow-y-auto border-r border-border lg:w-80`}>
        <h1 className='shrink-0 border-b border-border p-4 text-lg font-semibold'>Chats</h1>
        <ChatList initialPage={initialPage} onSelectChat={(id) => router.push(`/chats/${id}`)} />
      </div>

      <div className={`${chatId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-1 flex-col`}>
        {children}
      </div>
    </div>
  )
}
