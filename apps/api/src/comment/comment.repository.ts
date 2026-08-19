import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, decodeNumericCursor, encodeCursor, encodeNumericCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { COMMENT_SELECT } from './selects/comment.select'
import { commentViewerSelect } from './selects/comment.viewer.select'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentNotFoundException } from './exceptions/comment-not-found.exception'
import type { Comment, CommentNode, CommentPage, CommentSortBy, CommentTreeOptions, CommentViewerSelectResult, CommentWithRole } from './types/comment'

const SORTABLE_COLUMNS = {
  createdAt: Prisma.sql`"createdAt"`,
  updatedAt: Prisma.sql`"updatedAt"`,
  score: Prisma.sql`"score"`,
} as const

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toCommentWithRole(comment: CommentViewerSelectResult): CommentWithRole {
    const { commentVotes, ...rest } = comment
    return { ...rest, viewerVote: commentVotes[0]?.type ?? null }
  }

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
        (vba."blockerId" IS NOT NULL) AS "viewerBlockedAuthor",
        (abv."blockerId" IS NOT NULL) AS "authorBlockedViewer",
        up.username AS "authorUsername",
        up."displayName" AS "authorDisplayName",
        up."avatarUrl" AS "authorAvatarUrl",
        nm.role AS "authorRole",
        cv.type AS "viewerVote"
      FROM comment_tree t
      LEFT JOIN "UserProfile" up ON up."userId" = t."authorId"
      LEFT JOIN "UserBlock" vba ON vba."blockerId" = ${viewerId} AND vba."blockedId" = t."authorId"
      LEFT JOIN "UserBlock" abv ON abv."blockerId" = t."authorId" AND abv."blockedId" = ${viewerId}
      LEFT JOIN "NestMember" nm ON nm."userId" = t."authorId" AND nm."nestId" = ${nestId}
      LEFT JOIN "CommentVote" cv ON cv."commentId" = t.id AND cv."userId" = ${viewerId}
      ORDER BY ${orderBy}
    `
  }

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

  // For call sites where nestId/viewerId is only known after an initial getById lookup.
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

  async create(threadId: string, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    const comment = await db.comment.create({
      data: {
        threadId,
        authorId,
        content: dto.content
      },
      select: commentViewerSelect(nestId, authorId)
    })
    return this.toCommentWithRole(comment)
  }

  async createReply(parentComment: Comment, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    const reply = await db.comment.create({
      data: {
        threadId: parentComment.threadId,
        parentId: parentComment.id,
        authorId,
        content: dto.content,
        depth: parentComment.depth + 1,
      },
      select: commentViewerSelect(nestId, authorId)
    })

    await db.comment.update({
      where: { id: parentComment.id },
      data: { replyCount: { increment: 1 } }
    })

    return this.toCommentWithRole(reply)
  }

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

  async listActiveByAuthor(authorId: string, db: Database = this.prisma) {
    return db.comment.findMany({
      where: { authorId, deletedAt: null },
      select: { id: true, threadId: true, parentId: true }
    })
  }

  async softDeleteManyByAuthor(authorId: string, deletedById: string, db: Database = this.prisma) {
    return db.comment.updateMany({
      where: { authorId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById, deletedByPlatform: true }
    })
  }

  async getLatestCommentByThreadId(threadId: string, db: Database = this.prisma) {
    return db.comment.findFirst({
      where: { threadId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  }

  async decrementReplyCount(commentId: string | null, db: Database = this.prisma) {
    if (!commentId) {
      return
    }

    await db.comment.updateMany({
      where: { id: commentId, replyCount: { gt: 0 } },
      data: { replyCount: { decrement: 1 } }
    })
  }

  async adjustScore(commentId: string, delta: number, nestId: string, viewerId?: string, db: Database = this.prisma) {
    const comment = await db.comment.update({
      where: { id: commentId },
      data: { score: { increment: delta } },
      select: commentViewerSelect(nestId, viewerId)
    })
    return this.toCommentWithRole(comment)
  }
}
