'use client'

import { RoleBadge } from '@/common/components/role-badge'
import { UserLink } from '@/common/components/user-link'
import { VoteButtons } from '@/common/components/vote-buttons'
import { useUser } from '@/features/me/me.hooks'
import { useRemoveThreadVote, useVoteThread } from '@/features/thread/thread.hooks'
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

  return (
    <li className='rounded-md border border-border p-3'>
      <div className='flex items-start gap-3'>
        {user && (
          <VoteButtons
            score={thread.score}
            viewerVote={thread.viewerVote}
            disabled={voteThread.isPending || removeThreadVote.isPending}
            onUpvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'UPVOTE' })}
            onDownvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'DOWNVOTE' })}
            onRemove={() => removeThreadVote.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}

        <div>
          <div className='flex items-center gap-2'>
            {thread.pinnedAt && (
              <span className='rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground'>
                Pinned
              </span>
            )}
            {thread.lockedAt && (
              <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
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
              {thread.commentCount}
              {' comments'}
            </span>
          </p>
        </div>
      </div>
    </li>
  )
}
