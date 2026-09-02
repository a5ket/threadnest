'use client'

import { ModeratorIcon } from '@/common/components/authority-icons'
import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { ImageCarousel } from '@/common/components/image-carousel'
import { RoleBadge } from '@/common/components/role-badge'
import { SaveThreadButton } from '@/common/components/save-thread-button'
import { LockIcon, PinIcon } from '@/common/components/thread-status-icons'
import { UserLink } from '@/common/components/user-link'
import { VoteButtons } from '@/common/components/vote-buttons'
import { formatDateTime, formatRelativeTime } from '@/common/format-date'
import { BlockButton } from '@/features/block/components/block-button'
import { useUser } from '@/features/me/me.hooks'
import type { NestDetail } from '@/features/nest/nest.types'
import { RemoveThreadPlatformButton } from '@/features/platform-content/components/remove-thread-platform-button'
import { ReportButton } from '@/features/report/components/report-button'
import { useThreadStore, useThreadStoreApi } from '@/features/thread/components/thread-store-provider'
import { useDeleteThread, useLockThread, usePinThread, useRemoveThreadVote, useSaveThread, useUnlockThread, useUnpinThread, useUnsaveThread, useVoteThread } from '@/features/thread/thread.hooks'
import { NestAccessContextDtoVisibility } from '@/generated/api/models'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EditThreadForm } from './edit-thread-form'
import { ShareThreadButton } from './share-thread-button'

function CommentIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
      <path d='M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v6A1.5 1.5 0 0115.5 13H8l-3.5 3v-3H4.5A1.5 1.5 0 013 11.5v-6z' strokeLinejoin='round' />
    </svg>
  )
}

interface ThreadDetailProps {
  nestSlug: string
  nest: NestDetail | null
}

export function ThreadDetail({ nestSlug, nest }: ThreadDetailProps) {
  const thread = useThreadStore((state) => state.thread)
  const threadStore = useThreadStoreApi()
  const router = useRouter()
  const user = useUser()
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
  const saveThread = useSaveThread({ onSuccess: setThread })
  const unsaveThread = useUnsaveThread({ onSuccess: setThread })

  const isPrivate = nest?.access.visibility === NestAccessContextDtoVisibility.PRIVATE
  const isPaywalled = nest?.access.isPaywalled ?? false
  const isWalled = isPrivate || isPaywalled
  const walledMessage = isPrivate && isPaywalled
    ? 'This nest is private and paywalled — only members with an active subscription will be able to open this link.'
    : isPrivate
      ? 'This nest is private — only members will be able to open this link.'
      : 'This nest requires a paid subscription — people without one won\'t be able to open this link.'

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
        <p className='flex items-center gap-2 text-sm text-muted-foreground'>
          <UserLink user={thread.author} />
          <RoleBadge role={thread.author.role} />
          <span>
            {' · '}
            <span title={formatDateTime(thread.createdAt)}>{formatRelativeTime(thread.createdAt)}</span>
          </span>
          <BlockButton userId={thread.author.id} />
        </p>

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
          <h1 className='text-lg font-semibold'>{thread.title}</h1>
        </div>
      </div>

      {thread.attachments.length > 0 && (
        <ImageCarousel images={thread.attachments} />
      )}

      {thread.content !== null
        ? <p className='whitespace-pre-wrap text-sm'>{thread.content}</p>
        : <p className='text-sm italic text-muted-foreground'>Content unavailable.</p>}

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

        <a
          href='#comment-section'
          className='flex items-center gap-1 text-sm text-muted-foreground hover:underline'
        >
          <CommentIcon />
          {thread.commentCount}
          {' comments'}
        </a>

        {thread.access.canSaveThread && (
          <SaveThreadButton
            saved={thread.viewerSaved}
            disabled={saveThread.isPending || unsaveThread.isPending}
            onSave={() => saveThread.mutate({ nestSlug, threadSlug: thread.slug })}
            onUnsave={() => unsaveThread.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}

        <ShareThreadButton
          nestSlug={nestSlug}
          threadSlug={thread.slug}
          isWalled={isWalled}
          walledMessage={walledMessage}
        />

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
                  className='flex items-center gap-1 text-sm text-moderator hover:underline disabled:opacity-50'
                >
                  <ModeratorIcon />
                  {unlockThread.isPending ? 'Unlocking...' : 'Unlock'}
                </button>
              )
            : (
                <button
                  type='button'
                  disabled={lockThread.isPending}
                  onClick={() => lockThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='flex items-center gap-1 text-sm text-moderator hover:underline disabled:opacity-50'
                >
                  <ModeratorIcon />
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
                  className='flex items-center gap-1 text-sm text-moderator hover:underline disabled:opacity-50'
                >
                  <ModeratorIcon />
                  {unpinThread.isPending ? 'Unpinning...' : 'Unpin'}
                </button>
              )
            : (
                <button
                  type='button'
                  disabled={pinThread.isPending}
                  onClick={() => pinThread.mutate({ nestSlug, threadSlug: thread.slug })}
                  className='flex items-center gap-1 text-sm text-moderator hover:underline disabled:opacity-50'
                >
                  <ModeratorIcon />
                  {pinThread.isPending ? 'Pinning...' : 'Pin'}
                </button>
              )
        )}

        {thread.access.canDeleteThread && (
          <DeleteConfirmButton
            variant={user?.id === thread.author.id ? 'default' : 'moderator'}
            label={user?.id === thread.author.id ? 'Delete' : 'Remove'}
            title={user?.id === thread.author.id ? 'Delete this thread?' : 'Remove this thread?'}
            description='This permanently deletes the thread and all its comments. This cannot be undone.'
            isPending={deleteThread.isPending}
            onConfirm={() => deleteThread.mutate({ nestSlug, threadSlug: thread.slug })}
          />
        )}

        {user && user.id !== thread.author.id && (
          <ReportButton target={{ type: 'thread', nestSlug, threadSlug: thread.slug }} />
        )}

        {user?.platformAccess.isModerator && !thread.deletedAt && (
          <RemoveThreadPlatformButton nestSlug={nestSlug} threadId={thread.id} />
        )}
      </div>
    </div>
  )
}
