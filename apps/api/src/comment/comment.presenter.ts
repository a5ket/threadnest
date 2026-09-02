import { Injectable } from '@nestjs/common'
import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { StorageService } from 'src/storage/storage.service'
import { UserPresenter } from 'src/user/user.presenter'
import { CommentAuthorListItem } from './comment.repository'
import { CommentBlockFlags, CommentNode, CommentPage, CommentWithRole } from './types/comment'

/**
 * Shapes comment views, including the content/author redaction rules for deleted comments and
 * blocked users. {@link toView} and {@link toNodeView} apply the exact same rules to two
 * different underlying row shapes — see {@link redact}.
 */
@Injectable()
export class CommentPresenter {
  constructor(
    private readonly userPresenter: UserPresenter,
    private readonly storage: StorageService
  ) { }

  /**
   * Decides whether to hide a comment's content and/or author identity.
   *
   * - Not deleted: content is hidden only if the author has blocked the viewer
   *   (`authorBlockedViewer`) — the viewer genuinely can't see it. `viewerBlockedAuthor` is
   *   informational only; the blocker can still see the content.
   * - Deleted by the author themselves: always fully hidden, even from moderators.
   * - Deleted by someone else (moderator/platform): visible to moderators only within
   *   {@link MODERATION_GRACE_PERIOD_MS} of deletion, so they can review what was said.
   *
   * @returns Whether to null out `content` and/or `author` in the resulting view.
   */
  private redact(
    deletedAt: Date | null,
    deletedById: string | null,
    authorId: string,
    canModerateContent: boolean,
    authorBlockedViewer: boolean,
  ) {
    if (!deletedAt) {
      return { hideContent: authorBlockedViewer, hideAuthor: false }
    }

    const deletedByAuthor = deletedById === authorId
    if (deletedByAuthor) {
      return { hideContent: true, hideAuthor: true }
    }

    const withinGracePeriod = Date.now() - deletedAt.getTime() < MODERATION_GRACE_PERIOD_MS
    const visibleToModerator = canModerateContent && withinGracePeriod

    return { hideContent: !visibleToModerator, hideAuthor: !visibleToModerator }
  }

  /** Attachment URLs are presigned (not public) — comments can live inside private, paywalled nests. */
  private async toAttachmentView(key: string | null, width: number | null, height: number | null) {
    if (!key) return null
    return { url: await this.storage.getPresignedUrl(key), width, height }
  }

  /**
   * Single-comment view (e.g. after creating or updating one) — takes the nested `CommentWithRole`
   * shape. See {@link toNodeView} for the flat row shape used by tree listings.
   *
   * @param comment - The comment to present.
   * @param blockFlags - Whether the viewer and author have blocked each other — see {@link redact}.
   * @param canModerateContent - Whether the viewer can see redacted content/author within the grace period.
   */
  async toView(comment: CommentWithRole, blockFlags: CommentBlockFlags = { viewerBlockedAuthor: false, authorBlockedViewer: false }, canModerateContent = false) {
    const { hideContent, hideAuthor } = this.redact(comment.deletedAt, comment.deletedById, comment.authorId, canModerateContent, blockFlags.authorBlockedViewer)

    return {
      id: comment.id,
      threadId: comment.threadId,
      author: hideAuthor ? null : this.userPresenter.toReferenceView(comment.author, comment.author.nestMembership[0]?.role ?? null),
      parentId: comment.parentId,
      content: hideContent ? null : comment.content,
      attachment: hideContent ? null : await this.toAttachmentView(comment.attachments[0]?.key ?? null, comment.attachments[0]?.width ?? null, comment.attachments[0]?.height ?? null),
      replyCount: comment.replyCount,
      score: comment.score,
      viewerVote: comment.viewerVote,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      editedAt: comment.editedAt,
      deletedAt: comment.deletedAt,
      // Regular viewers see only that a comment is gone; who removed it (and whether it was
      // platform vs. nest moderation) is nest-moderator-only. Platform admin identity stays
      // masked even from nest moderators.
      deletedById: canModerateContent && !comment.deletedByPlatform ? comment.deletedById : undefined,
      deletedByPlatform: canModerateContent ? comment.deletedByPlatform : undefined,
      viewerBlockedAuthor: blockFlags.viewerBlockedAuthor,
      authorBlockedViewer: blockFlags.authorBlockedViewer,
    }
  }

  /**
   * Tree-listing view — takes the flat, denormalized `CommentNode` row shape produced by the
   * recursive tree query, as opposed to {@link toView}'s nested `author` object.
   *
   * @param node - The comment row to present.
   * @param canModerateContent - Whether the viewer can see redacted content/author within the grace period.
   */
  async toNodeView(node: CommentNode, canModerateContent = false) {
    const { hideContent, hideAuthor } = this.redact(node.deletedAt, node.deletedById, node.authorId, canModerateContent, node.authorBlockedViewer)

    return {
      id: node.id,
      threadId: node.threadId,
      author: hideAuthor ? null : {
        id: node.authorId,
        profile: {
          username: node.authorUsername,
          displayName: node.authorDisplayName,
          avatarUrl: node.authorAvatarKey ? this.storage.getPublicUrl(node.authorAvatarKey) : null,
        },
        role: node.authorRole,
      },
      parentId: node.parentId,
      content: hideContent ? null : node.content,
      attachment: hideContent ? null : await this.toAttachmentView(node.attachmentKey, node.attachmentWidth, node.attachmentHeight),
      replyCount: node.replyCount,
      score: node.score,
      viewerVote: node.viewerVote,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      editedAt: node.editedAt,
      deletedAt: node.deletedAt,
      // Regular viewers see only that a comment is gone; who removed it (and whether it was
      // platform vs. nest moderation) is nest-moderator-only. Platform admin identity stays
      // masked even from nest moderators.
      deletedById: canModerateContent && !node.deletedByPlatform ? node.deletedById : undefined,
      deletedByPlatform: canModerateContent ? node.deletedByPlatform : undefined,
      depth: node.depth,
      viewerBlockedAuthor: node.viewerBlockedAuthor,
      authorBlockedViewer: node.authorBlockedViewer,
    }
  }

  /**
   * Row shape for a user's "comments I've made" list. No redaction applied — the underlying
   * query already excludes deleted comments, and blocking doesn't apply to your own content.
   *
   * @param item - The comment row to present.
   */
  async toAuthorItemView(item: CommentAuthorListItem) {
    return {
      id: item.id,
      content: item.content,
      createdAt: item.createdAt,
      thread: item.thread,
      nest: item.nest,
      attachment: await this.toAttachmentView(item.attachmentKey, item.attachmentWidth, item.attachmentHeight),
    }
  }

  /** Presents every node in a comment-tree page via {@link toNodeView}, passing pagination meta through unchanged. */
  async toTreePage(page: CommentPage, canModerateContent = false) {
    return {
      items: await Promise.all(page.items.map((node) => this.toNodeView(node, canModerateContent))),
      meta: page.meta,
    }
  }
}
