'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useRouter } from 'next/navigation'
import { groupCommentsByParent } from '@/features/comment/comment.utils'
import { useCommentTree, useInvalidateCommentTree } from '@/features/comment/comment.hooks'
import type { CommentTreePage } from '@/features/comment/comment.types'
import type { NestThreadCommentListSortBy } from '@/generated/api/models'
import Link from 'next/link'
import { CommentTree } from './comment-tree'
import { CreateThreadCommentForm } from './create-thread-comment-form'

interface CommentSectionProps {
  nestSlug: string
  threadSlug: string
  sortBy: NestThreadCommentListSortBy
  initialPage: CommentTreePage
}

export function CommentSection({ nestSlug, threadSlug, sortBy, initialPage }: CommentSectionProps) {
  const router = useRouter()
  const invalidate = useInvalidateCommentTree(nestSlug, threadSlug)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommentTree(nestSlug, threadSlug, sortBy, initialPage)

  const comments = data.pages.flatMap((page) => page.items)
  const childrenByParent = groupCommentsByParent(comments)
  const threadUrl = `/n/${nestSlug}/t/${threadSlug}`
  const sort = sortBy === 'score' ? 'top' : 'new'

  return (
    <div className='flex flex-col gap-4 pb-6'>
      <CreateThreadCommentForm
        nestSlug={nestSlug}
        threadSlug={threadSlug}
        onCreated={() => {
          invalidate()
          router.refresh()
        }}
      />

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

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && comments.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </div>
  )
}
