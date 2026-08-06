'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { RoleBadge } from '@/common/components/role-badge'
import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
import { useThreadStore, useThreadStoreApi } from '@/features/thread/components/thread-store-provider'
import { useDeleteThread } from '@/features/thread/thread.hooks'
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
          <span>{getUserDisplayName(thread.author)}</span>
          <RoleBadge role={thread.author.role} />
          <span>
            {' · '}
            {formatDateTime(thread.createdAt)}
          </span>
        </p>
      </div>

      <div className='rounded-md border border-border p-4'>
        {thread.content !== null
          ? <p className='whitespace-pre-wrap text-sm'>{thread.content}</p>
          : <p className='text-sm italic text-muted-foreground'>Content unavailable.</p>}
      </div>

      <div className='flex items-center gap-4'>
        <p className='text-sm text-muted-foreground'>
          {thread.commentCount}
          {' comments'}
        </p>

        {thread.access.canEditThread && (
          <button type='button' onClick={() => setIsEditing(true)} className='text-sm text-muted-foreground hover:underline'>
            Edit
          </button>
        )}

        {thread.access.canDeleteThread && (
          <DeleteConfirmButton isPending={deleteThread.isPending} onConfirm={() => deleteThread.mutate({ nestSlug, threadSlug: thread.slug })} />
        )}
      </div>
    </div>
  )
}
