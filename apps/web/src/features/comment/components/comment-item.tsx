'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { RoleBadge } from '@/common/components/role-badge'
import { UserLink } from '@/common/components/user-link'
import { VoteButtons } from '@/common/components/vote-buttons'
import { formatDateTime } from '@/common/format-date'
import { BlockButton } from '@/features/block/components/block-button'
import { useThreadStore } from '@/features/thread/components/thread-store-provider'
import { useDeleteComment, useInvalidateCommentTree, useRemoveCommentVote, useVoteComment } from '@/features/comment/comment.hooks'
import type { CommentNode } from '@/features/comment/comment.types'
import { useUser } from '@/features/me/me.hooks'
import { RemoveCommentPlatformButton } from '@/features/platform-content/components/remove-comment-platform-button'
import { ReportButton } from '@/features/report/components/report-button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EditCommentForm } from './edit-comment-form'
import { ReplyForm } from './reply-form'

interface CommentItemProps {
  comment: CommentNode
  nestSlug: string
  threadSlug: string
  childrenCount: number
}

export function CommentItem({ comment, nestSlug, threadSlug, childrenCount }: CommentItemProps) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const router = useRouter()
  const user = useUser()
  const canModerateContent = useThreadStore((state) => state.thread.access.canModerateContent)
  const canVoteComment = useThreadStore((state) => state.thread.access.canVoteComment)
  const invalidate = useInvalidateCommentTree(nestSlug, threadSlug)

  const deleteComment = useDeleteComment({
    onSuccess: () => {
      invalidate()
      router.refresh()
    }
  })

  const voteComment = useVoteComment({
    onSuccess: () => invalidate()
  })

  const removeCommentVote = useRemoveCommentVote({
    onSuccess: () => invalidate()
  })

  const hiddenReplyCount = comment.replyCount - childrenCount
  const isDeleted = comment.deletedAt !== null
  const isAuthor = user !== null && comment.author?.id === user.id
  const canReply = !isDeleted
  const canEdit = !isDeleted && isAuthor
  const canDelete = !isDeleted && (isAuthor || canModerateContent)
  const canVote = !isDeleted && canVoteComment

  if (editing) {
    return (
      <EditCommentForm
        commentId={comment.id}
        content={comment.content ?? ''}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          invalidate()
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2 text-sm'>
        <UserLink user={comment.author} className='font-medium' />
        {comment.author?.role && <RoleBadge role={comment.author.role} />}
        <span className='text-xs text-muted-foreground'>{formatDateTime(comment.createdAt)}</span>
      </div>

      {comment.content !== null
        ? (
            <p className='whitespace-pre-wrap text-sm'>{comment.content}</p>
          )
        : (
            <p className='text-sm italic text-muted-foreground'>Comment unavailable.</p>
          )}

      <div className='flex items-center gap-3 text-xs'>
        {canVote && (
          <VoteButtons
            score={comment.score}
            viewerVote={comment.viewerVote}
            disabled={voteComment.isPending || removeCommentVote.isPending}
            onUpvote={() => voteComment.mutate({ commentId: comment.id, type: 'UPVOTE' })}
            onDownvote={() => voteComment.mutate({ commentId: comment.id, type: 'DOWNVOTE' })}
            onRemove={() => removeCommentVote.mutate({ commentId: comment.id })}
          />
        )}

        {canReply && !replying && (
          <button type='button' onClick={() => setReplying(true)} className='text-muted-foreground hover:underline'>
            Reply
          </button>
        )}

        {canEdit && (
          <button type='button' onClick={() => setEditing(true)} className='text-muted-foreground hover:underline'>
            Edit
          </button>
        )}

        {canDelete && (
          <DeleteConfirmButton
            title='Delete this comment?'
            description={'This can\'t be undone. The comment will be permanently removed.'}
            isPending={deleteComment.isPending}
            onConfirm={() => deleteComment.mutate({ commentId: comment.id })}
          />
        )}

        {comment.author && <BlockButton userId={comment.author.id} />}

        {!isDeleted && user && comment.author && user.id !== comment.author.id && (
          <ReportButton target={{ type: 'comment', commentId: comment.id }} />
        )}

        {!isDeleted && user?.platformAccess.isModerator && (
          <RemoveCommentPlatformButton
            commentId={comment.id}
            onRemoved={() => {
              invalidate()
              router.refresh()
            }}
          />
        )}

        {hiddenReplyCount > 0 && (
          <Link href={`/n/${nestSlug}/t/${threadSlug}/c/${comment.id}`} className='text-primary hover:underline'>
            View
            {' '}
            {hiddenReplyCount}
            {' '}
            more
            {' '}
            {hiddenReplyCount === 1 ? 'reply' : 'replies'}
          </Link>
        )}
      </div>

      {replying && (
        <ReplyForm
          commentId={comment.id}
          onCancel={() => setReplying(false)}
          onCreated={() => {
            setReplying(false)
            invalidate()
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
