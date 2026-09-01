import { getCommentRepliesServer, getCommentServer } from '@/features/comment/comment.server'
import { groupCommentsByParent } from '@/features/comment/comment.utils'
import { CommentItem } from '@/features/comment/components/comment-item'
import { CommentTree } from '@/features/comment/components/comment-tree'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CommentPage({
  params
}: {
  params: Promise<{ nestSlug: string, threadSlug: string, commentId: string }>
}) {
  const { nestSlug, threadSlug, commentId } = await params

  const [comment, repliesPage] = await Promise.all([
    getCommentServer(commentId),
    getCommentRepliesServer(commentId)
  ])

  if (!comment) {
    notFound()
  }

  const childrenByParent = groupCommentsByParent(repliesPage.items)
  const directChildren = childrenByParent.get(commentId) ?? []

  return (
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}/t/${threadSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to thread
      </Link>

      <CommentItem
        comment={{ ...comment, depth: 0 }}
        nestSlug={nestSlug}
        threadSlug={threadSlug}
        childrenCount={directChildren.length}
      />

      <div className='ml-4 border-l border-border pl-4'>
        <CommentTree childrenByParent={childrenByParent} parentId={commentId} nestSlug={nestSlug} threadSlug={threadSlug} />
      </div>
    </div>
  )
}
