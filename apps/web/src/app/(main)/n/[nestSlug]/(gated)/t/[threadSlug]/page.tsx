import { getCommentTreeServer } from '@/features/comment/comment.server'
import { CommentSection } from '@/features/comment/components/comment-section'
import { NestRightRail } from '@/features/nest/components/nest-right-rail'
import { getNestServer } from '@/features/nest/nest.server'
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
  const [commentPage, nest] = await Promise.all([
    getCommentTreeServer(nestSlug, threadSlug, sortBy),
    getNestServer(nestSlug)
  ])

  return (
    <div className='flex flex-col gap-8 p-6'>
      {nest && (
        <NestRightRail
          name={nest.name}
          slug={nest.slug}
          description={nest.description}
          iconUrl={nest.iconUrl}
          visibility={nest.access.visibility}
          memberCount={nest.memberCount}
          threadCount={nest.threadCount}
          createdAt={nest.createdAt}
        />
      )}

      <ThreadDetail nestSlug={nestSlug} />
      <CommentSection nestSlug={nestSlug} threadSlug={threadSlug} sortBy={sortBy} initialPage={commentPage} />
    </div>
  )
}
