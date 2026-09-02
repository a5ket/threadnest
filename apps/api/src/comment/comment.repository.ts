import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, decodeNumericCursor, encodeCursor, encodeNumericCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { COMMENT_SELECT } from './selects/comment.select'
import { commentViewerSelect } from './selects/comment.viewer.select'
import { CommentAuthorQueryDto } from './dto/comment-author.query.dto'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentNotFoundException } from './exceptions/comment-not-found.exception'
import type { Comment, CommentNode, CommentPage, CommentSortBy, CommentTreeOptions, CommentViewerSelectResult, CommentWithRole } from './types/comment'

type CommentAuthorRow = {
  id: string
  content: string
  createdAt: Date
  threadTitle: string
  threadSlug: string
  nestName: string
  nestSlug: string
  attachmentKey: string | null
  attachmentWidth: number | null
  attachmentHeight: number | null
}

export type CommentAuthorListItem = {
  id: string
  content: string
  createdAt: Date
  thread: { title: string, slug: string }
  nest: { name: string, slug: string }
  attachmentKey: string | null
  attachmentWidth: number | null
  attachmentHeight: number | null
}

const SORTABLE_COLUMNS = {
  createdAt: Prisma.sql`"createdAt"`,
  updatedAt: Prisma.sql`"updatedAt"`,
  score: Prisma.sql`"score"`,
} as const

/**
 * Persistence for comments, including the recursive-CTE tree queries behind
 * {@link getByThread}/{@link getReplies}.
 */
@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param comment - A row selected via {@link commentViewerSelect}, with the viewer's vote as a
   * (0- or 1-element) relation array.
   * @returns The same comment, with `viewerVote` flattened to a single value.
   */
  private toCommentWithRole(comment: CommentViewerSelectResult): CommentWithRole {
    const { commentVotes, ...rest } = comment
    return { ...rest, viewerVote: commentVotes[0]?.type ?? null }
  }

  /**
   * Builds the recursive CTE shared by {@link getTree}/{@link getByThread}/{@link getReplies}:
   * walk from `anchor` (one or more root comments) down through replies up to `maxDepth`,
   * capping each level at `replyLimit` replies (ordered by `column`/`order`), then joins in
   * author/attachment/vote/block info for the resulting rows in a single query.
   *
   * @param anchor - SQL `WHERE` fragment selecting the root row(s) to start from.
   * @param column - The column driving `orderBy`'s sort (score/createdAt/updatedAt).
   * @param order - `ASC` or `DESC`, matching `orderBy`.
   * @param maxDepth - How many levels of replies to include below the anchor.
   * @param replyLimit - Max replies fetched per parent, per level.
   * @param orderBy - Full SQL `ORDER BY` fragment for the final result set.
   * @param viewerId - Used to join in the viewer's own vote and block relationships.
   * @param nestId - Used to join in each author's role within this specific nest.
   */
  private buildTreeSql(
    anchor: Prisma.Sql,
    column: Prisma.Sql,
    order: Prisma.Sql,
    maxDepth: number,
    replyLimit: number,
    orderBy: Prisma.Sql,
    viewerId: string | null,
    nestId: string,
  ) {
    return Prisma.sql`
      WITH RECURSIVE comment_tree AS (
        SELECT id, "threadId", "authorId", "parentId", content, "replyCount", "score", "createdAt", "updatedAt", "editedAt", "deletedAt", "deletedById", "deletedByPlatform", 0 AS depth, id AS root_id
        FROM "Comment"
        WHERE ${anchor}
        UNION ALL
        SELECT r.id, r."threadId", r."authorId", r."parentId", r.content, r."replyCount", r."score", r."createdAt", r."updatedAt", r."editedAt", r."deletedAt", r."deletedById", r."deletedByPlatform", ct.depth + 1, ct.root_id
        FROM comment_tree ct
        CROSS JOIN LATERAL (
          SELECT c.*
          FROM "Comment" c
          WHERE c."parentId" = ct.id
          ORDER BY c.${column} ${order}, c.id ${order}
          LIMIT ${replyLimit}
        ) r
        WHERE ct.depth < ${maxDepth}
      )
      SELECT
        t.id, t."threadId", t."authorId", t."parentId", t.content, t."replyCount", t."score",
        t."createdAt", t."updatedAt", t."editedAt", t."deletedAt", t."deletedById", t."deletedByPlatform", t.depth,
        ca.key AS "attachmentKey", ca.width AS "attachmentWidth", ca.height AS "attachmentHeight",
        (vba."blockerId" IS NOT NULL) AS "viewerBlockedAuthor",
        (abv."blockerId" IS NOT NULL) AS "authorBlockedViewer",
        up.username AS "authorUsername",
        up."displayName" AS "authorDisplayName",
        up."avatarKey" AS "authorAvatarKey",
        nm.role AS "authorRole",
        cv.type AS "viewerVote"
      FROM comment_tree t
      LEFT JOIN "CommentAttachment" ca ON ca."commentId" = t.id
      LEFT JOIN "UserProfile" up ON up."userId" = t."authorId"
      LEFT JOIN "UserBlock" vba ON vba."blockerId" = ${viewerId} AND vba."blockedId" = t."authorId"
      LEFT JOIN "UserBlock" abv ON abv."blockerId" = t."authorId" AND abv."blockedId" = ${viewerId}
      LEFT JOIN "NestMember" nm ON nm."userId" = t."authorId" AND nm."nestId" = ${nestId}
      LEFT JOIN "CommentVote" cv ON cv."commentId" = t.id AND cv."userId" = ${viewerId}
      ORDER BY ${orderBy}
    `
  }

  /**
   * Comment listings can sort by `score` (numeric cursor) as well as timestamp fields, unlike
   * most cursor-paginated listings in this codebase — so the cursor codec used depends on `sortBy`.
   *
   * @param cursor - The raw cursor, or a falsy value for the first page.
   * @param sortBy - Which cursor encoding to use.
   * @returns The decoded cursor, or `null` for the first page.
   * @throws {InvalidCursorException} `cursor` is malformed.
   */
  private decodeCommentCursor(cursor: string | null | undefined, sortBy: CommentSortBy): { value: Date | number; id: string } | null {
    if (!cursor) {
      return null
    }

    try {
      if (sortBy === 'score') {
        return decodeNumericCursor(cursor)
      }

      const { date, id } = decodeCursor(cursor)
      return { value: date, id }
    } catch {
      throw new InvalidCursorException()
    }
  }

  /**
   * @param decoded - The decoded cursor from {@link decodeCommentCursor}, or `null` for the first page.
   * @param sortBy - Which column the cursor's `value` applies to.
   * @param sortAscending - The listing's sort direction, which flips the comparison operators.
   * @returns A Prisma `where` fragment for "everything after this cursor", or `{}` for the first page.
   */
  private buildCursorWhere(
    decoded: { value: Date | number; id: string } | null,
    sortBy: CommentSortBy,
    sortAscending: boolean,
  ) {
    if (!decoded) {
      return {}
    }

    return {
      OR: [
        { [sortBy]: sortAscending ? { gt: decoded.value } : { lt: decoded.value } },
        { [sortBy]: decoded.value, id: sortAscending ? { gt: decoded.id } : { lt: decoded.id } }
      ]
    }
  }

  private async paginateRoots(
    where: Prisma.CommentWhereInput,
    countWhere: Prisma.CommentWhereInput,
    sortBy: CommentSortBy,
    sortAscending: boolean,
    limit: number,
  ) {
    const dir = sortAscending ? 'asc' as const : 'desc' as const
    const [page, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        select: { id: true, createdAt: true, updatedAt: true, score: true },
        orderBy: [{ [sortBy]: dir }, { id: dir }],
        take: limit + 1
      }),
      this.prisma.comment.count({ where: countWhere })
    ])
    const hasNextPage = page.length > limit
    const items = hasNextPage ? page.slice(0, limit) : page
    const last = items[items.length - 1]
    const cursorValue = last?.[sortBy]
    const nextCursor = hasNextPage && last && cursorValue !== undefined
      ? (sortBy === 'score' ? encodeNumericCursor(cursorValue as number, last.id) : encodeCursor(cursorValue as Date, last.id))
      : null

    return { items, total, hasNextPage, nextCursor }
  }

  /** The full subtree rooted at one comment, unpaginated. Currently unused by any caller in this codebase. */
  getTree(commentId: string, nestId: string, viewerId: string | null, options: Omit<CommentTreeOptions, 'limit' | 'cursor'>) {
    const { maxDepth, replyLimit, sortBy, sortAscending } = options
    const column = SORTABLE_COLUMNS[sortBy]
    const order = sortAscending ? Prisma.sql`ASC` : Prisma.sql`DESC`
    const sql = this.buildTreeSql(
      Prisma.sql`id = ${commentId}`,
      column, order, maxDepth, replyLimit,
      Prisma.sql`t.depth ASC, t.${column} ${order}, t.id ${order}`,
      viewerId,
      nestId,
    )

    return this.prisma.$queryRaw<CommentNode[]>(sql)
  }

  /**
   * Paginates root comments first, then fetches each root's reply subtree via {@link buildTreeSql}
   * in a single follow-up query — two queries total, regardless of tree size.
   */
  async getByThread(threadId: string, nestId: string, viewerId: string | null, options: CommentTreeOptions): Promise<CommentPage> {
    const { maxDepth, replyLimit, sortBy, sortAscending, limit, cursor } = options
    const column = SORTABLE_COLUMNS[sortBy]
    const order = sortAscending ? Prisma.sql`ASC` : Prisma.sql`DESC`

    const decoded = this.decodeCommentCursor(cursor, sortBy)
    const cursorWhere = this.buildCursorWhere(decoded, sortBy, sortAscending)

    const { items: roots, total, hasNextPage, nextCursor } = await this.paginateRoots(
      { threadId, parentId: null, ...cursorWhere },
      { threadId, parentId: null },
      sortBy, sortAscending, limit,
    )

    if (roots.length === 0) {
      return { items: [], meta: { total, limit, hasMore: false, nextCursor: null } }
    }

    const rootIds = roots.map(r => r.id)
    const sql = this.buildTreeSql(
      Prisma.sql`id = ANY(${rootIds}::text[])`,
      column, order, maxDepth, replyLimit,
      Prisma.sql`array_position(${rootIds}::text[], t.root_id), t.depth ASC, t.${column} ${order}, t.id ${order}`,
      viewerId,
      nestId,
    )
    const items = await this.prisma.$queryRaw<CommentNode[]>(sql)

    return { items, meta: { total, limit, hasMore: hasNextPage, nextCursor } }
  }

  /**
   * Same two-query pagination strategy as {@link getByThread}, rooted at a comment's direct
   * replies instead of a thread's top-level comments.
   */
  async getReplies(parentId: string, nestId: string, viewerId: string | null, options: CommentTreeOptions): Promise<CommentPage> {
    const { maxDepth, replyLimit, sortBy, sortAscending, limit, cursor } = options
    const column = SORTABLE_COLUMNS[sortBy]
    const order = sortAscending ? Prisma.sql`ASC` : Prisma.sql`DESC`

    const decoded = this.decodeCommentCursor(cursor, sortBy)
    const cursorWhere = this.buildCursorWhere(decoded, sortBy, sortAscending)

    const { items: replies, total, hasNextPage, nextCursor } = await this.paginateRoots(
      { parentId, ...cursorWhere },
      { parentId },
      sortBy, sortAscending, limit,
    )

    if (replies.length === 0) {
      return { items: [], meta: { total, limit, hasMore: false, nextCursor: null } }
    }

    const replyIds = replies.map(r => r.id)
    const sql = this.buildTreeSql(
      Prisma.sql`id = ANY(${replyIds}::text[])`,
      column, order, maxDepth, replyLimit,
      Prisma.sql`array_position(${replyIds}::text[], t.root_id), t.depth ASC, t.${column} ${order}, t.id ${order}`,
      viewerId,
      nestId,
    )
    const items = await this.prisma.$queryRaw<CommentNode[]>(sql)

    return { items, meta: { total, limit, hasMore: hasNextPage, nextCursor } }
  }

  /**
   * Viewer-aware re-fetch, for call sites where `nestId`/`viewerId` is only known after an
   * initial {@link getById} lookup.
   *
   * @throws {CommentNotFoundException} No such comment.
   */
  async getByIdForViewer(commentId: string, nestId: string, viewerId?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: commentViewerSelect(nestId, viewerId)
    })

    if (!comment) {
      throw new CommentNotFoundException()
    }

    return this.toCommentWithRole(comment)
  }

  /**
   * The bare policy-subject shape, unscoped by nest/viewer — used where only the id is known.
   *
   * @throws {CommentNotFoundException} No such comment.
   */
  async getById(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: COMMENT_SELECT
    })

    if (!comment) {
      throw new CommentNotFoundException()
    }

    return comment
  }

  /**
   * Creates a top-level comment on a thread — see {@link createReply} for a reply to another comment.
   *
   * @param threadId - The thread to comment on.
   * @param authorId - The comment's author.
   * @param nestId - The thread's nest, used to resolve the author's nest role in the response.
   * @param dto - Content and optional attachment.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created comment.
   */
  async create(threadId: string, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    const comment = await db.comment.create({
      data: {
        threadId,
        authorId,
        content: dto.content,
        attachments: dto.attachment
          ? { create: { key: dto.attachment.key, width: dto.attachment.width, height: dto.attachment.height, order: 0 } }
          : undefined
      },
      select: commentViewerSelect(nestId, authorId)
    })
    return this.toCommentWithRole(comment)
  }

  /** Creates the reply and increments the parent's `replyCount` in the same call. */
  async createReply(parentComment: Comment, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    const reply = await db.comment.create({
      data: {
        threadId: parentComment.threadId,
        parentId: parentComment.id,
        authorId,
        content: dto.content,
        depth: parentComment.depth + 1,
        attachments: dto.attachment
          ? { create: { key: dto.attachment.key, width: dto.attachment.width, height: dto.attachment.height, order: 0 } }
          : undefined
      },
      select: commentViewerSelect(nestId, authorId)
    })

    await db.comment.update({
      where: { id: parentComment.id },
      data: { replyCount: { increment: 1 } }
    })

    return this.toCommentWithRole(reply)
  }

  /**
   * @param commentId - The comment to update.
   * @param nestId - The thread's nest, used to resolve the author's nest role in the response.
   * @param dto - The new content.
   * @param viewerId - The viewer, used to resolve their vote on the updated comment.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated comment.
   * @throws {CommentNotFoundException} No comment with this id.
   */
  async updateById(commentId: string, nestId: string, dto: CommentUpdateDto, viewerId?: string, db: Database = this.prisma) {
    try {
      const comment = await db.comment.update({
        where: { id: commentId },
        data: { content: dto.content, editedAt: new Date() },
        select: commentViewerSelect(nestId, viewerId)
      })
      return this.toCommentWithRole(comment)
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new CommentNotFoundException()
      }

      throw error
    }
  }

  /**
   * @param commentId - The comment to delete.
   * @param deletedById - The user performing the deletion.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @param deletedByPlatform - Whether this is a platform-level removal (bypassing nest
   * moderation), used by {@link CommentPresenter} to decide who the deletion is attributed to.
   * @throws {CommentNotFoundException} No comment with this id.
   */
  async softDeleteById(commentId: string, deletedById: string, db: Database = this.prisma, deletedByPlatform = false) {
    try {
      await db.comment.update({
        where: {
          id: commentId
        },
        data: {
          deletedAt: new Date(),
          deletedById,
          deletedByPlatform
        }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new CommentNotFoundException()
      }

      throw error
    }
  }

  /**
   * Raw-SQL listing for a user's profile activity feed — joins through to the thread/nest to
   * filter out comments in nests the viewer can't see (deleted, or private and not a member of).
   *
   * @param authorId - The comment author whose activity to list.
   * @param viewerId - The viewer, or `undefined` if anonymous; gates private-nest visibility.
   * @param query - Pagination options.
   * @returns A cursor-paginated page of the author's comments, newest first.
   * @throws {InvalidCursorException} `query.cursor` is malformed.
   */
  async listByAuthor(authorId: string, viewerId: string | undefined, query: CommentAuthorQueryDto) {
    let cursorSql = Prisma.sql`TRUE`

    if (query.cursor) {
      try {
        const { date, id } = decodeCursor(query.cursor)
        cursorSql = Prisma.sql`(c."createdAt" < ${date}) OR (c."createdAt" = ${date} AND c.id < ${id})`
      } catch {
        throw new InvalidCursorException()
      }
    }

    const visibilitySql = viewerId
      ? Prisma.sql`(ns.visibility = 'PUBLIC' OR EXISTS (SELECT 1 FROM "NestMember" vm WHERE vm."nestId" = t."nestId" AND vm."userId" = ${viewerId}))`
      : Prisma.sql`ns.visibility = 'PUBLIC'`

    const rows = await this.prisma.$queryRaw<CommentAuthorRow[]>(Prisma.sql`
      SELECT
        c.id, c.content, c."createdAt",
        t.title AS "threadTitle", t.slug AS "threadSlug",
        n.name AS "nestName", n.slug AS "nestSlug",
        ca.key AS "attachmentKey", ca.width AS "attachmentWidth", ca.height AS "attachmentHeight"
      FROM "Comment" c
      JOIN "Thread" t ON t.id = c."threadId"
      JOIN "Nest" n ON n.id = t."nestId"
      JOIN "NestSettings" ns ON ns."nestId" = t."nestId"
      LEFT JOIN "CommentAttachment" ca ON ca."commentId" = c.id
      WHERE c."authorId" = ${authorId}
        AND c."deletedAt" IS NULL AND t."deletedAt" IS NULL AND n."deletedAt" IS NULL
        AND ${visibilitySql} AND ${cursorSql}
      ORDER BY c."createdAt" DESC, c.id DESC
      LIMIT ${query.limit + 1}
    `)

    const hasMore = rows.length > query.limit
    const page = hasMore ? rows.slice(0, query.limit) : rows
    const items: CommentAuthorListItem[] = page.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      thread: { title: row.threadTitle, slug: row.threadSlug },
      nest: { name: row.nestName, slug: row.nestSlug },
      attachmentKey: row.attachmentKey,
      attachmentWidth: row.attachmentWidth,
      attachmentHeight: row.attachmentHeight,
    }))
    const last = page.at(-1)

    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  /**
   * @param authorId - The author whose non-deleted comments to list.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns Minimal identifying info for every non-deleted comment by this author — for bulk
   * moderation flows that need to know which comments/threads/parents are affected, not full comment data.
   */
  async listActiveByAuthor(authorId: string, db: Database = this.prisma) {
    return db.comment.findMany({
      where: { authorId, deletedAt: null },
      select: { id: true, threadId: true, parentId: true }
    })
  }

  /**
   * Bulk platform-level removal of every comment by a user, in one query.
   *
   * @param authorId - The author whose comments to remove.
   * @param deletedById - The platform moderator performing the removal.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The count of comments removed.
   */
  async softDeleteManyByAuthor(authorId: string, deletedById: string, db: Database = this.prisma) {
    return db.comment.updateMany({
      where: { authorId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById, deletedByPlatform: true }
    })
  }

  /**
   * @param threadId - The thread to check.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The most recent non-deleted comment's timestamp, or `null` if the thread has none.
   */
  async getLatestCommentByThreadId(threadId: string, db: Database = this.prisma) {
    return db.comment.findFirst({
      where: { threadId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  }

  /**
   * @param commentId - Pass null for a top-level comment (no parent to update) — a no-op, not an error.
   */
  async decrementReplyCount(commentId: string | null, db: Database = this.prisma) {
    if (!commentId) {
      return
    }

    await db.comment.updateMany({
      where: { id: commentId, replyCount: { gt: 0 } },
      data: { replyCount: { decrement: 1 } }
    })
  }

  /**
   * @param commentId - The comment whose score to adjust.
   * @param delta - The signed change to apply — see {@link computeVoteScoreDelta}.
   * @param nestId - The thread's nest, used to resolve the author's nest role in the response.
   * @param viewerId - The voter, used to resolve their vote on the updated comment.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated comment.
   */
  async adjustScore(commentId: string, delta: number, nestId: string, viewerId?: string, db: Database = this.prisma) {
    const comment = await db.comment.update({
      where: { id: commentId },
      data: { score: { increment: delta } },
      select: commentViewerSelect(nestId, viewerId)
    })
    return this.toCommentWithRole(comment)
  }
}
