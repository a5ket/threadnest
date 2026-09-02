'use client'

import { LockIcon } from '@/common/components/thread-status-icons'
import { useAuthOverlayStore } from '@/features/auth/auth-overlay.store'
import type { CommentDetail } from '@/features/comment/comment.types'
import { useUser } from '@/features/me/me.hooks'
import { JoinNestControl } from '@/features/nest/components/join-nest-control'
import type { NestDetail } from '@/features/nest/nest.types'
import type { ThreadDetail } from '@/features/thread/thread.types'
import { CreateThreadCommentForm } from './create-thread-comment-form'

interface CommentComposerProps {
  nestSlug: string
  threadSlug: string
  thread: ThreadDetail
  nest: NestDetail | null
  onCreated: (comment: CommentDetail) => void
}

export function CommentComposer({ nestSlug, threadSlug, thread, nest, onCreated }: CommentComposerProps) {
  const user = useUser()
  const openAuthOverlay = useAuthOverlayStore((state) => state.open)

  if (thread.access.canCommentThread) {
    return <CreateThreadCommentForm nestSlug={nestSlug} threadSlug={threadSlug} onCreated={onCreated} />
  }

  if (thread.lockedAt) {
    return (
      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <LockIcon />
        <span>This thread is locked. New comments are disabled.</span>
      </div>
    )
  }

  if (!user) {
    return (
      <button
        type='button'
        onClick={() => openAuthOverlay('login')}
        className='w-full rounded-md border border-input bg-background px-3 py-2.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-ring'
      >
        Sign in to join the conversation...
      </button>
    )
  }

  if (nest?.access.isBanned) {
    return (
      <p className='text-sm text-muted-foreground'>{'You\'re banned from this nest and can\'t comment.'}</p>
    )
  }

  if (!user.emailVerified) {
    return (
      <p className='text-sm text-muted-foreground'>Verify your email address to comment — check your inbox for the verification link.</p>
    )
  }

  if (nest && !nest.access.isMember) {
    return (
      <div className='flex flex-col gap-2'>
        <p className='text-sm text-muted-foreground'>Join this nest to comment.</p>
        <JoinNestControl nestSlug={nestSlug} nestName={nest.name} joinPolicy={nest.access.joinPolicy} />
      </div>
    )
  }

  return (
    <p className='text-sm text-muted-foreground'>{'You don\'t have permission to comment on this thread.'}</p>
  )
}
