'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { SortTabLink } from '@/common/components/sort-tab-link'
import { useRouter } from 'next/navigation'
import { groupCommentsByParent } from '@/features/comment/comment.utils'
import { useCommentTree, useInvalidateCommentTree } from '@/features/comment/comment.hooks'
import type { CommentTreePage } from '@/features/comment/comment.types'
import type { NestThreadCommentListSortBy } from '@/generated/api/models'
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

      <div className='flex items-center gap-2'>
        <SortTabLink href={threadUrl} active={sort !== 'top'}>New</SortTabLink>
        <SortTabLink href={`${threadUrl}?sort=top`} active={sort === 'top'}>Top</SortTabLink>
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
