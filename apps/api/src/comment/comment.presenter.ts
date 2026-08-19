import { Injectable } from '@nestjs/common'
import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { CommentBlockFlags, CommentNode, CommentPage, CommentWithRole } from './types/comment'

@Injectable()
export class CommentPresenter {
  private redact(
    deletedAt: Date | null,
    deletedById: string | null,
    authorId: string,
    canModerateContent: boolean,
    authorBlockedViewer: boolean,
  ) {
    if (!deletedAt) {
      // authorBlockedViewer hides content the viewer genuinely can't see;
      // viewerBlockedAuthor is informational only — the blocker can still see it
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

  toView(comment: CommentWithRole, blockFlags: CommentBlockFlags = { viewerBlockedAuthor: false, authorBlockedViewer: false }, canModerateContent = false) {
    const { hideContent, hideAuthor } = this.redact(comment.deletedAt, comment.deletedById, comment.authorId, canModerateContent, blockFlags.authorBlockedViewer)

    return {
      id: comment.id,
      threadId: comment.threadId,
      author: hideAuthor ? null : {
        id: comment.author.id,
        profile: comment.author.profile,
        role: comment.author.nestMembership[0]?.role ?? null,
      },
      parentId: comment.parentId,
      content: hideContent ? null : comment.content,
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

  toNodeView(node: CommentNode, canModerateContent = false) {
    const { hideContent, hideAuthor } = this.redact(node.deletedAt, node.deletedById, node.authorId, canModerateContent, node.authorBlockedViewer)

    return {
      id: node.id,
      threadId: node.threadId,
      author: hideAuthor ? null : {
        id: node.authorId,
        profile: {
          username: node.authorUsername,
          displayName: node.authorDisplayName,
          avatarUrl: node.authorAvatarUrl,
        },
        role: node.authorRole,
      },
      parentId: node.parentId,
      content: hideContent ? null : node.content,
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

  toTreePage(page: CommentPage, canModerateContent = false) {
    return {
      items: page.items.map((node) => this.toNodeView(node, canModerateContent)),
      meta: page.meta,
    }
  }
}
