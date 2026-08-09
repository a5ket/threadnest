'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { RoleBadge } from '@/common/components/role-badge'
import { UserLink } from '@/common/components/user-link'
import { VoteButtons } from '@/common/components/vote-buttons'
import { formatDateTime } from '@/common/format-date'
import { BlockButton } from '@/features/block/components/block-button'
import { useThreadStore, useThreadStoreApi } from '@/features/thread/components/thread-store-provider'
import { useDeleteThread, useLockThread, usePinThread, useRemoveThreadVote, useUnlockThread, useUnpinThread, useVoteThread } from '@/features/thread/thread.hooks'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EditThreadForm } from './edit-thread-form'

interface ThreadDetailProps {
  nestSlug: string
}

export function ThreadDetail({ nestSlug }: ThreadDetailProps) {
  const thread = useThreadStore((state) => state.thread)
  const threadStore = useThreadStoreApi()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const deleteThread = useDeleteThread({
    onSuccess: () => router.push(`/n/${nestSlug}`)
  })

  const setThread = threadStore.getState().setThread

  const lockThread = useLockThread({ onSuccess: setThread })
  const unlockThread = useUnlockThread({ onSuccess: setThread })
  const pinThread = usePinThread({ onSuccess: setThread })
  const unpinThread = useUnpinThread({ onSuccess: setThread })
  const voteThread = useVoteThread({ onSuccess: setThread })
  const removeThreadVote = useRemoveThreadVote({ onSuccess: setThread })

  if (isEditing) {
    return (
      <div className='flex flex-col gap-4'>
        <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
          ← Back to nest
        </Link>

        <EditThreadForm
          nestSlug={nestSlug}
          threadSlug={thread.slug}
          thread={thread}
          onSaved={(updated) => {
            threadStore.getState().setThread(updated)
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <div className='flex flex-col gap-2'>
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
          <h1 className='text-lg font-semibold'>{thread.title}</h1>
        </div>

        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <UserLink user={thread.author} />
          <RoleBadge role={thread.author.role} />
          <span>
            {' · '}
            {formatDateTime(thread.createdAt)}
          </span>
          <BlockButton userId={thread.author.id} />
        </p>
      </div>

      <div className='rounded-md border border-border p-4'>
        {thread.content !== null
          ? <p className='whitespace-pre-wrap text-sm'>{thread.content}</p>
          : <p className='text-sm italic text-muted-foreground'>Content unavailable.</p>}
      </div>

      <div className='flex items-center gap-4'>
        {thread.access.canVoteThread && (
          <VoteButtons
            score={thread.score}
            viewerVote={thread.viewerVote}
            disabled={voteThread.isPending || removeThreadVote.isPending}
            onUpvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'UPVOTE' })}
            onDownvote={() => voteThread.mutate({ nestSlug, threadSlug: thread.slug, type: 'DOWNVOTE' })}
            onRemove={() => removeThreadVote.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}

        <p className='text-sm text-muted-foreground'>
          {thread.commentCount}
          {' comments'}
        </p>

        {thread.access.canEditThread && (
          <button type='button' onClick={() => setIsEditing(true)} className='text-sm text-muted-foreground hover:underline'>
            Edit
          </button>
        )}

        {thread.access.canManageThreadLock && (
          thread.lockedAt
            ? (
                <button
                  type='button'
                  disabled={unlockThread.isPending}
                  onClick={() => unlockThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
                >
                  {unlockThread.isPending ? 'Unlocking...' : 'Unlock'}
                </button>
              )
            : (
                <button
                  type='button'
                  disabled={lockThread.isPending}
                  onClick={() => lockThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
                >
                  {lockThread.isPending ? 'Locking...' : 'Lock'}
                </button>
              )
        )}

        {thread.access.canManageThreadPin && (
          thread.pinnedAt
            ? (
                <button
                  type='button'
                  disabled={unpinThread.isPending}
                  onClick={() => unpinThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
                >
                  {unpinThread.isPending ? 'Unpinning...' : 'Unpin'}
                </button>
              )
            : (
                <button
                  type='button'
                  disabled={pinThread.isPending}
                  onClick={() => pinThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
                >
                  {pinThread.isPending ? 'Pinning...' : 'Pin'}
                </button>
              )
        )}

        {thread.access.canDeleteThread && (
          <DeleteConfirmButton
            title='Delete this thread?'
            description='This permanently deletes the thread and all its comments. This cannot be undone.'
            isPending={deleteThread.isPending}
            onConfirm={() => deleteThread.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}
      </div>
    </div>
  )
}
