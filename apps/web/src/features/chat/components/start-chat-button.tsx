'use client'

import { useRouter } from 'next/navigation'
import { useStartChat } from '../chat.hooks'

interface StartChatButtonProps {
  userId: string
}

export function StartChatButton({ userId }: StartChatButtonProps) {
  const router = useRouter()
  const startChat = useStartChat({
    onSuccess: (chat) => router.push(`/chats/${chat.id}`)
  })

  return (
    <button
      type='button'
      disabled={startChat.isPending}
      onClick={() => startChat.mutate(userId)}
      className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
    >
      {startChat.isPending ? 'Starting...' : 'Message'}
    </button>
  )
}
