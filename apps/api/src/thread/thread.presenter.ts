import { Injectable } from '@nestjs/common'
import { StorageService } from 'src/storage/storage.service'
import { UserPresenter } from 'src/user/user.presenter'
import { ThreadDetails } from './types/thread.details'
import { ThreadSummary } from './types/thread.summary'
import { ThreadAccessContext } from './types/thread.access-context'
import { ThreadSearchResult } from './thread.repository'

type AuthorWithMembership = (ThreadSummary | ThreadDetails)['author']
type AttachmentWithKey = (ThreadSummary | ThreadDetails)['attachments'][number]

/** Shapes thread views for listings, search results, and the thread detail page. */
@Injectable()
export class ThreadPresenter {
  constructor(
    private readonly userPresenter: UserPresenter,
    private readonly storage: StorageService
  ) { }

  private toAuthorView(author: AuthorWithMembership) {
    return this.userPresenter.toReferenceView(author, author.nestMembership[0]?.role ?? null)
  }

  /** Attachment URLs are presigned (not public) — threads can live inside private, paywalled nests. */
  private async toAttachmentsView(attachments: AttachmentWithKey[]) {
    return Promise.all(attachments.map(async (a) => ({
      id: a.id,
      key: a.key,
      url: await this.storage.getPresignedUrl(a.key),
      width: a.width,
      height: a.height,
    })))
  }

  /**
   * Row shape for a nest's thread listing.
   *
   * @param thread - The thread to present.
   */
  async toSummaryView(thread: ThreadSummary) {
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
      attachments: await this.toAttachmentsView(thread.attachments),
    }
  }

  /**
   * Cross-nest listing row (search, feed, saved, profile activity) — a summary plus which nest
   * it belongs to.
   *
   * @param thread - The thread to present.
   */
  async toSearchResultView(thread: ThreadSearchResult) {
    return {
      ...await this.toSummaryView(thread),
      nest: thread.nest,
    }
  }

  /**
   * The thread detail page's data. Content is hidden unless `ctx.canReadContent` — see
   * {@link ThreadAccess.getContext} for when that's false (e.g. a paywalled nest the viewer
   * hasn't subscribed to). Who deleted a removed thread stays nest-moderator-only, and a
   * platform-admin deletion masks the deleter's identity even from nest moderators.
   *
   * @param thread - The thread to present.
   * @param ctx - The viewer's permission context for this thread.
   */
  async toDetailView(thread: ThreadDetails, ctx: ThreadAccessContext) {
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
      attachments: await this.toAttachmentsView(thread.attachments),
    }
  }
}
