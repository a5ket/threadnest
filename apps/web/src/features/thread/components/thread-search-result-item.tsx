'use client'

import { SaveThreadButton } from '@/common/components/save-thread-button'
import { UserLink } from '@/common/components/user-link'
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
    <li className='rounded-md border border-border p-3'>
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
    </li>
  )
}
