import { Injectable } from '@nestjs/common'
import { ThreadDetails } from './types/thread.details'
import { ThreadSummary } from './types/thread.summary'
import { ThreadAccessContext } from './types/thread.access-context'

type AuthorWithMembership = (ThreadSummary | ThreadDetails)['author']

@Injectable()
export class ThreadPresenter {
  private toAuthorView(author: AuthorWithMembership) {
    return {
      id: author.id,
      profile: author.profile,
      role: author.nestMembership[0]?.role ?? null,
    }
  }

  toSummaryView(thread: ThreadSummary) {
    return {
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastCommentAt: thread.lastCommentAt,
      commentCount: thread.commentCount,
      score: thread.score,
      viewerVote: thread.viewerVote,
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      author: this.toAuthorView(thread.author),
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
      score: thread.score,
      viewerVote: thread.viewerVote,
      deletedAt: ctx.canDeleteThread ? thread.deletedAt : undefined,
      deletedById: ctx.canDeleteThread ? thread.deletedById : undefined,
      author: this.toAuthorView(thread.author),
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      access: ctx,
    }
  }
}
