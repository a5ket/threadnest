'use client'

import { useRouter } from 'next/navigation'
import { groupCommentsByParent } from '@/features/comment/comment.utils'
import type { CommentNode } from '@/features/comment/comment.types'
import Link from 'next/link'
import { CommentTree } from './comment-tree'
import { CreateThreadCommentForm } from './create-thread-comment-form'

interface CommentSectionProps {
  nestSlug: string
  threadSlug: string
  comments: CommentNode[]
  sort: 'new' | 'top'
}

export function CommentSection({ nestSlug, threadSlug, comments, sort }: CommentSectionProps) {
  const router = useRouter()
  const childrenByParent = groupCommentsByParent(comments)
  const threadUrl = `/n/${nestSlug}/t/${threadSlug}`

  return (
    <div className='flex flex-col gap-4'>
      <CreateThreadCommentForm nestSlug={nestSlug} threadSlug={threadSlug} onCreated={() => router.refresh()} />

      <div className='flex items-center gap-3 text-sm'>
        <Link href={threadUrl} className={sort === 'top' ? 'text-muted-foreground hover:underline' : 'font-medium text-foreground'}>
          New
        </Link>
        <Link href={`${threadUrl}?sort=top`} className={sort === 'top' ? 'font-medium text-foreground' : 'text-muted-foreground hover:underline'}>
          Top
        </Link>
      </div>

      <CommentTree childrenByParent={childrenByParent} parentId={null} nestSlug={nestSlug} threadSlug={threadSlug} />

      {comments.length === 0 && (
        <p className='text-sm text-muted-foreground'>No comments yet.</p>
      )}
    </div>
  )
}
