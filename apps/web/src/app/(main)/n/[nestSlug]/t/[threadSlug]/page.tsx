import { getCommentTreeServer } from '@/features/comment/comment.server'
import { CommentSection } from '@/features/comment/components/comment-section'
import { ThreadDetail } from '@/features/thread/components/thread-detail'

export default async function ThreadPage({
  params
}: {
  params: Promise<{ nestSlug: string, threadSlug: string }>
}) {
  const { nestSlug, threadSlug } = await params
  const commentPage = await getCommentTreeServer(nestSlug, threadSlug)

  return (
    <div className='flex flex-col gap-8 p-6'>
      <ThreadDetail nestSlug={nestSlug} />
      <CommentSection nestSlug={nestSlug} threadSlug={threadSlug} comments={commentPage.items} />
    </div>
  )
}
