'use client'

import { useRouter } from 'next/navigation'
import { groupCommentsByParent } from '@/features/comment/comment.utils'
import type { CommentNode } from '@/features/comment/comment.types'
import { CommentTree } from './comment-tree'
import { CreateThreadCommentForm } from './create-thread-comment-form'

interface CommentSectionProps {
  nestSlug: string
  threadSlug: string
  comments: CommentNode[]
}

export function CommentSection({ nestSlug, threadSlug, comments }: CommentSectionProps) {
  const router = useRouter()
  const childrenByParent = groupCommentsByParent(comments)

  return (
    <div className='flex flex-col gap-4'>
      <CreateThreadCommentForm nestSlug={nestSlug} threadSlug={threadSlug} onCreated={() => router.refresh()} />

      <CommentTree childrenByParent={childrenByParent} parentId={null} nestSlug={nestSlug} threadSlug={threadSlug} />

      {comments.length === 0 && (
        <p className='text-sm text-muted-foreground'>No comments yet.</p>
      )}
    </div>
  )
}
