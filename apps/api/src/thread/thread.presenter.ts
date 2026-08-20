import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { ThreadDetails } from './types/thread.details'
import { ThreadSummary } from './types/thread.summary'
import { ThreadAccessContext } from './types/thread.access-context'
import { ThreadSearchResult } from './thread.repository'

type AuthorWithMembership = (ThreadSummary | ThreadDetails)['author']

@Injectable()
export class ThreadPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  private toAuthorView(author: AuthorWithMembership) {
    return this.userPresenter.toReferenceView(author, author.nestMembership[0]?.role ?? null)
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
      viewerSaved: thread.viewerSaved,
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      author: this.toAuthorView(thread.author),
    }
  }

  toSearchResultView(thread: ThreadSearchResult) {
    return {
      ...this.toSummaryView(thread),
      nest: thread.nest,
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
      viewerSaved: thread.viewerSaved,
      deletedAt: thread.deletedAt,
      // Regular viewers see only that a thread is gone; who removed it (and whether it was
      // platform vs. nest moderation) is nest-moderator-only. Platform admin identity stays
      // masked even from nest moderators.
      deletedById: ctx.canModerateContent && !thread.deletedByPlatform ? thread.deletedById : undefined,
      deletedByPlatform: ctx.canModerateContent ? thread.deletedByPlatform : undefined,
      author: this.toAuthorView(thread.author),
      lockedAt: thread.lockedAt,
      pinnedAt: thread.pinnedAt,
      access: ctx,
    }
  }
}
