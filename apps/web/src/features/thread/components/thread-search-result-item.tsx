'use client'

import { SaveThreadButton } from '@/common/components/save-thread-button'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime, formatRelativeTime } from '@/common/format-date'
import { useUser } from '@/features/me/me.hooks'
import { useSaveThread, useUnsaveThread } from '@/features/thread/thread.hooks'
import type { ThreadSearchResult } from '@/features/thread/thread.types'
import Link from 'next/link'
import { useState } from 'react'

interface ThreadSearchResultItemProps {
  thread: ThreadSearchResult
}

export function ThreadSearchResultItem({ thread: initialThread }: ThreadSearchResultItemProps) {
  const [thread, setThread] = useState(initialThread)
  const user = useUser()

  const saveThread = useSaveThread({ onSuccess: (updated) => setThread((prev) => ({ ...prev, viewerSaved: updated.viewerSaved })) })
  const unsaveThread = useUnsaveThread({ onSuccess: (updated) => setThread((prev) => ({ ...prev, viewerSaved: updated.viewerSaved })) })

  return (
    <li className='p-3 transition-colors hover:bg-muted/50'>
      <div className='flex items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Link href={`/n/${thread.nest.slug}`} className='hover:underline'>
              {thread.nest.name}
            </Link>
          </div>

          <Link href={`/n/${thread.nest.slug}/t/${thread.slug}`} className='font-medium hover:underline'>
            {thread.title}
          </Link>

          <p className='flex items-center gap-2 text-sm text-muted-foreground'>
            <UserLink user={thread.author} />
            <span>
              {' · '}
              <span title={formatDateTime(thread.createdAt)}>{formatRelativeTime(thread.createdAt)}</span>
              {' · '}
              {thread.score}
              {' points · '}
              {thread.commentCount}
              {' comments'}
            </span>
            {user && (
              <SaveThreadButton
                saved={thread.viewerSaved}
                disabled={saveThread.isPending || unsaveThread.isPending}
                onSave={() => saveThread.mutate({ nestSlug: thread.nest.slug, threadSlug: thread.slug })}
                onUnsave={() => unsaveThread.mutate({ nestSlug: thread.nest.slug, threadSlug: thread.slug })}
              />
            )}
          </p>

          {thread.attachments[0] && (
            <Link
              href={`/n/${thread.nest.slug}/t/${thread.slug}`}
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
