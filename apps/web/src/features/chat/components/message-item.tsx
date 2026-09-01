'use client'

import { formatDateTime } from '@/common/format-date'
import { useDeleteMessage } from '../message.hooks'
import type { Message } from '../chat.types'
import { ReportMessageButton } from './report-message-button'

interface MessageItemProps {
  message: Message
  chatId: string
  isOwn: boolean
  onReply: (message: Message) => void
  seen: boolean
}

export function MessageItem({ message, chatId, isOwn, onReply, seen }: MessageItemProps) {
  const deleteMessage = useDeleteMessage()

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {message.replyTo && (
        <div className='max-w-[75%] truncate rounded-md border-l-2 border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground'>
          {message.replyTo.content ?? 'This message was deleted'}
        </div>
      )}

      <div className={`group flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div
          className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          } ${message.deletedAt ? 'italic opacity-70' : ''}`}
        >
          {message.content ?? 'This message was deleted'}
        </div>

        {!message.deletedAt && (
          <span className='hidden items-center gap-2 group-hover:flex'>
            <button
              type='button'
              onClick={() => onReply(message)}
              className='text-xs text-muted-foreground hover:underline'
            >
              Reply
            </button>

            {isOwn
              ? (
                  <button
                    type='button'
                    disabled={deleteMessage.isPending}
                    onClick={() => deleteMessage.mutate({ chatId, messageId: message.id })}
                    className='text-xs text-muted-foreground hover:text-destructive hover:underline disabled:opacity-50'
                  >
                    Delete
                  </button>
                )
              : (
                  <ReportMessageButton messageId={message.id} />
                )}
          </span>
        )}
      </div>

      <span className='text-[10px] text-muted-foreground'>
        {formatDateTime(message.createdAt)}
        {seen && ' · Seen'}
      </span>
    </div>
  )
}
