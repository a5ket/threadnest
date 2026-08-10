import { getCommentTreeServer } from '@/features/comment/comment.server'
import { CommentSection } from '@/features/comment/components/comment-section'
import { ThreadDetail } from '@/features/thread/components/thread-detail'
import { NestThreadCommentListSortBy } from '@/generated/api/models'

export default async function ThreadPage({
  params,
  searchParams
}: {
  params: Promise<{ nestSlug: string, threadSlug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { nestSlug, threadSlug } = await params
  const { sort } = await searchParams
  const sortBy = sort === 'top' ? NestThreadCommentListSortBy.score : NestThreadCommentListSortBy.createdAt
  const commentPage = await getCommentTreeServer(nestSlug, threadSlug, sortBy)

  return (
    <div className='flex flex-col gap-8 p-6'>
      <ThreadDetail nestSlug={nestSlug} />
      <CommentSection nestSlug={nestSlug} threadSlug={threadSlug} comments={commentPage.items} sort={sort === 'top' ? 'top' : 'new'} />
    </div>
  )
}
