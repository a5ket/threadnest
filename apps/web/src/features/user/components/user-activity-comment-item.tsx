import { formatDateTime } from '@/common/format-date'
import type { CommentAuthorItemResponseDto } from '@/generated/api/models'
import Link from 'next/link'

interface UserActivityCommentItemProps {
  comment: CommentAuthorItemResponseDto
}

export function UserActivityCommentItem({ comment }: UserActivityCommentItemProps) {
  return (
    <li className='rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm'>
      <div className='flex items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Link href={`/n/${comment.nest.slug}`} className='hover:underline'>
              {comment.nest.name}
            </Link>
            <span>{'· commented on '}</span>
            <Link href={`/n/${comment.nest.slug}/t/${comment.thread.slug}`} className='hover:underline'>
              {comment.thread.title}
            </Link>
          </div>

          <Link
            href={`/n/${comment.nest.slug}/t/${comment.thread.slug}/c/${comment.id}`}
            className='block text-sm hover:underline'
          >
            {comment.content}
          </Link>

          <p className='mt-1 text-xs text-muted-foreground'>{formatDateTime(comment.createdAt)}</p>
        </div>

        {comment.attachment && (
          <Link href={`/n/${comment.nest.slug}/t/${comment.thread.slug}/c/${comment.id}`} className='shrink-0'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.attachment.url}
              alt=''
              className='h-16 w-16 rounded-md object-cover'
            />
          </Link>
        )}
      </div>
    </li>
  )
}
