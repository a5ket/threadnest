'use client'

import { RoleBadge } from '@/common/components/role-badge'
import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
import type { CommentNode } from '@/features/comment/comment.types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ReplyForm } from './reply-form'

interface CommentItemProps {
  comment: CommentNode
  nestSlug: string
  threadSlug: string
  childrenCount: number
}

export function CommentItem({ comment, nestSlug, threadSlug, childrenCount }: CommentItemProps) {
  const [replying, setReplying] = useState(false)
  const router = useRouter()

  const authorName = comment.author ? getUserDisplayName(comment.author) : '[deleted]'
  const hiddenReplyCount = comment.replyCount - childrenCount
  const canReply = comment.deletedAt === null

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2 text-sm'>
        <span className='font-medium'>{authorName}</span>
        {comment.author?.role && <RoleBadge role={comment.author.role} />}
        <span className='text-xs text-muted-foreground'>{formatDateTime(comment.createdAt)}</span>
      </div>

      {comment.content !== null
        ? (
            <p className='whitespace-pre-wrap text-sm'>{comment.content}</p>
          )
        : (
            <p className='text-sm italic text-muted-foreground'>Comment unavailable.</p>
          )}

      <div className='flex items-center gap-3 text-xs'>
        {canReply && !replying && (
          <button type='button' onClick={() => setReplying(true)} className='text-muted-foreground hover:underline'>
            Reply
          </button>
        )}

        {hiddenReplyCount > 0 && (
          <Link href={`/n/${nestSlug}/t/${threadSlug}/c/${comment.id}`} className='text-primary hover:underline'>
            View
            {' '}
            {hiddenReplyCount}
            {' '}
            more
            {' '}
            {hiddenReplyCount === 1 ? 'reply' : 'replies'}
          </Link>
        )}
      </div>

      {replying && (
        <ReplyForm
          commentId={comment.id}
          onCancel={() => setReplying(false)}
          onCreated={() => {
            setReplying(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
