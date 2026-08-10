import { UserLink } from '@/common/components/user-link'
import type { ThreadSearchResult } from '@/features/thread/thread.types'
import Link from 'next/link'

interface ThreadSearchResultItemProps {
  thread: ThreadSearchResult
}

export function ThreadSearchResultItem({ thread }: ThreadSearchResultItemProps) {
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
      </p>
    </li>
  )
}
