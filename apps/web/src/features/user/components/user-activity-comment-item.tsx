import { formatDateTime, formatRelativeTime } from '@/common/format-date'
import type { CommentAuthorItemResponseDto } from '@/generated/api/models'
import Link from 'next/link'

interface UserActivityCommentItemProps {
  comment: CommentAuthorItemResponseDto
}

export function UserActivityCommentItem({ comment }: UserActivityCommentItemProps) {
  return (
    <li className='p-3 transition-colors hover:bg-muted/50'>
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

          <p className='mt-1 text-xs text-muted-foreground' title={formatDateTime(comment.createdAt)}>{formatRelativeTime(comment.createdAt)}</p>

          {comment.attachment && (
            <Link
              href={`/n/${comment.nest.slug}/t/${comment.thread.slug}/c/${comment.id}`}
              className='mt-3 block overflow-hidden rounded-md border border-border bg-background'
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comment.attachment.url}
                alt=''
                className='max-h-[480px] w-full object-cover'
                style={{ aspectRatio: `${comment.attachment.width} / ${comment.attachment.height}` }}
              />
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
