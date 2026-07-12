import { Injectable } from '@nestjs/common'
import { ThreadDetails } from './types/thread.details'
import { ThreadSummary } from './types/thread.summary'
import { ThreadAccessContext } from './types/thread.access-context'

@Injectable()
export class ThreadPresenter {
  toSummaryView(thread: ThreadSummary) {
    return {
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastCommentAt: thread.lastCommentAt,
      commentCount: thread.commentCount,
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      author: thread.author,
    }
  }

  toDetailView(thread: ThreadDetails, ctx: ThreadAccessContext) {
    return {
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      content: ctx.canReadContent ? thread.content : null,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastCommentAt: thread.lastCommentAt,
      commentCount: thread.commentCount,
      deletedAt: ctx.canDeleteThread ? thread.deletedAt : undefined,
      deletedById: ctx.canDeleteThread ? thread.deletedById : undefined,
      author: thread.author,
      nestId: thread.nestId,
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      access: ctx,
    }
  }
}