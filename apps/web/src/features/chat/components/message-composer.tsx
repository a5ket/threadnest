'use client'

import { useUnblockUser } from '@/features/block/block.hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { chatQueryKeys } from '../chat.hooks'
import { useSendMessage } from '../message.hooks'
import type { ChatDetail, Message } from '../chat.types'

interface MessageComposerProps {
  chat: ChatDetail
  replyingTo: Message | null
  onCancelReply: () => void
  onSent: () => void
}

export function MessageComposer({ chat, replyingTo, onCancelReply, onSent }: MessageComposerProps) {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const sendMessage = useSendMessage({
    onSuccess: () => {
      setContent('')
      onCancelReply()
      onSent()
    }
  })

  const unblockUser = useUnblockUser({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'blocks'] })
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.detail(chat.id) })
    }
  })

  if (chat.access.youBlockedThem) {
    return (
      <div className='flex shrink-0 items-center justify-between gap-3 border-t border-border p-3 text-sm text-muted-foreground'>
        <span>You blocked this user and can&apos;t message them.</span>
        <button
          type='button'
          disabled={unblockUser.isPending}
          onClick={() => chat.otherParticipant && unblockUser.mutate(chat.otherParticipant.id)}
          className='shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50'
        >
          Unblock
        </button>
      </div>
    )
  }

  if (chat.access.blockedByThem) {
    return (
      <div className='shrink-0 border-t border-border p-3 text-sm text-muted-foreground'>
        You&apos;ve been blocked by this user and can no longer send messages here.
      </div>
    )
  }

  if (!chat.access.canSendMessage) {
    return (
      <div className='shrink-0 border-t border-border p-3 text-sm text-muted-foreground'>
        You can&apos;t send messages in this chat.
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    sendMessage.mutate({ chatId: chat.id, content: content.trim(), replyToId: replyingTo?.id })
  }

  return (
    <form onSubmit={handleSubmit} className='flex shrink-0 flex-col gap-2 border-t border-border p-3'>
      {replyingTo && (
        <div className='flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground'>
          <span className='truncate'>
            {'Replying to: '}
            {replyingTo.content ?? 'This message was deleted'}
          </span>
          <button type='button' onClick={onCancelReply} className='shrink-0 hover:underline'>
            Cancel
          </button>
        </div>
      )}

      <div className='flex items-end gap-2'>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder='Type a message...'
          rows={1}
          maxLength={4000}
          className='flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
        />

        <button
          type='submit'
          disabled={sendMessage.isPending || !content.trim()}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          Send
        </button>
      </div>
    </form>
  )
}
