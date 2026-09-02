'use client'

import { RoleBadge } from '@/common/components/role-badge'
import { SaveThreadButton } from '@/common/components/save-thread-button'
import { LockIcon, PinIcon } from '@/common/components/thread-status-icons'
import { UserLink } from '@/common/components/user-link'
import { VoteButtons } from '@/common/components/vote-buttons'
import { formatDateTime, formatRelativeTime } from '@/common/format-date'
import { useUser } from '@/features/me/me.hooks'
import { useRemoveThreadVote, useSaveThread, useUnsaveThread, useVoteThread } from '@/features/thread/thread.hooks'
import type { ThreadSummary } from '@/features/thread/thread.types'
import Link from 'next/link'
import { useState } from 'react'

interface ThreadListItemProps {
  nestSlug: string
  thread: ThreadSummary
}

export function ThreadListItem({ nestSlug, thread: initialThread }: ThreadListItemProps) {
  const [thread, setThread] = useState(initialThread)
  const user = useUser()

  const voteThread = useVoteThread({ onSuccess: setThread })
  const removeThreadVote = useRemoveThreadVote({ onSuccess: setThread })
  const saveThread = useSaveThread({ onSuccess: setThread })
  const unsaveThread = useUnsaveThread({ onSuccess: setThread })

  return (
    <li className='p-3 transition-colors hover:bg-muted/50'>
      <div className='flex items-start gap-3'>
        {user && (
          <VoteButtons
            score={thread.score}
            viewerVote={thread.viewerVote}
            disabled={voteThread.isPending || removeThreadVote.isPending}
            orientation='vertical'
            onUpvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'UPVOTE' })}
            onDownvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'DOWNVOTE' })}
            onRemove={() => removeThreadVote.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            {thread.pinnedAt && (
              <span className='inline-flex items-center gap-1 text-xs font-medium text-muted-foreground'>
                <PinIcon />
                Pinned
              </span>
            )}
            {thread.lockedAt && (
              <span className='inline-flex items-center gap-1 text-xs font-medium text-muted-foreground'>
                <LockIcon />
                Locked
              </span>
            )}
            <Link href={`/n/${nestSlug}/t/${thread.slug}`} className='font-medium hover:underline'>
              {thread.title}
            </Link>
          </div>

          <p className='flex items-center gap-2 text-sm text-muted-foreground'>
            <UserLink user={thread.author} />
            <RoleBadge role={thread.author.role} />
            <span>
              {' · '}
              <span title={formatDateTime(thread.createdAt)}>{formatRelativeTime(thread.createdAt)}</span>
              {' · '}
              {thread.commentCount}
              {' comments'}
            </span>
            {user && (
              <SaveThreadButton
                saved={thread.viewerSaved}
                disabled={saveThread.isPending || unsaveThread.isPending}
                onSave={() => saveThread.mutate({ nestSlug, threadSlug: thread.slug })}
                onUnsave={() => unsaveThread.mutate({ nestSlug, threadSlug: thread.slug })}
              />
            )}
          </p>

          {thread.attachments[0] && (
            <Link
              href={`/n/${nestSlug}/t/${thread.slug}`}
              className='mt-3 block overflow-hidden rounded-md border border-border bg-background'
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thread.attachments[0].url}
                alt=''
                className='max-h-[480px] w-full object-cover'
                style={{ aspectRatio: `${thread.attachments[0].width} / ${thread.attachments[0].height}` }}
              />
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
