import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { COMMENT_SELECT } from './selects/comment.select'
import { commentRoleSelect } from './selects/comment.role.select'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentNotFoundException } from './exceptions/comment-not-found.exception'
import type { Comment, CommentNode, CommentPage, CommentSortBy, CommentTreeOptions } from './types/comment'

const SORTABLE_COLUMNS = {
  createdAt: Prisma.sql`"createdAt"`,
  updatedAt: Prisma.sql`"updatedAt"`,
} as const

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) { }


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
        SELECT id, "threadId", "authorId", "parentId", content, "replyCount", "createdAt", "updatedAt", "editedAt", "deletedAt", "deletedById", 0 AS depth, id AS root_id
        FROM "Comment"
        WHERE ${anchor}
        UNION ALL
        SELECT r.id, r."threadId", r."authorId", r."parentId", r.content, r."replyCount", r."createdAt", r."updatedAt", r."editedAt", r."deletedAt", r."deletedById", ct.depth + 1, ct.root_id
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
        t.id, t."threadId", t."authorId", t."parentId", t.content, t."replyCount",
        t."createdAt", t."updatedAt", t."editedAt", t."deletedAt", t."deletedById", t.depth,
        (vba."blockerId" IS NOT NULL) AS "viewerBlockedAuthor",
        (abv."blockerId" IS NOT NULL) AS "authorBlockedViewer",
        up.username AS "authorUsername",
        up."displayName" AS "authorDisplayName",
        up."avatarUrl" AS "authorAvatarUrl",
        nm.role AS "authorRole"
      FROM comment_tree t
      LEFT JOIN "UserProfile" up ON up."userId" = t."authorId"
      LEFT JOIN "UserBlock" vba ON vba."blockerId" = ${viewerId} AND vba."blockedId" = t."authorId"
      LEFT JOIN "UserBlock" abv ON abv."blockerId" = t."authorId" AND abv."blockedId" = ${viewerId}
      LEFT JOIN "NestMember" nm ON nm."userId" = t."authorId" AND nm."nestId" = ${nestId}
      ORDER BY ${orderBy}
    `
  }

  private buildCursorWhere(
    decoded: { date: Date; id: string } | null,
    sortBy: CommentSortBy,
    sortAscending: boolean,
  ) {
    if (!decoded) {
      return {}
    }

    return {
      OR: [
        { [sortBy]: sortAscending ? { gt: decoded.date } : { lt: decoded.date } },
        { [sortBy]: decoded.date, id: sortAscending ? { gt: decoded.id } : { lt: decoded.id } }
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
        select: { id: true, createdAt: true, updatedAt: true },
        orderBy: [{ [sortBy]: dir }, { id: dir }],
        take: limit + 1
      }),
      this.prisma.comment.count({ where: countWhere })
    ])
    const hasNextPage = page.length > limit
    const items = hasNextPage ? page.slice(0, limit) : page
    const last = items[items.length - 1]
    const cursorValue = last?.[sortBy]
    const nextCursor = hasNextPage && cursorValue && last
      ? encodeCursor(cursorValue, last.id)
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

    let decoded: { date: Date; id: string } | null = null
    if (cursor) {
      try {
        decoded = decodeCursor(cursor)
      } catch {
        throw new InvalidCursorException()
      }
    }

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

    let decoded: { date: Date; id: string } | null = null
    if (cursor) {
      try {
        decoded = decodeCursor(cursor)
      } catch {
        throw new InvalidCursorException()
      }
    }

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

  // Internal-shape lookup (no author role) — nestId isn't known ahead of this call.
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

  create(threadId: string, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    return db.comment.create({
      data: {
        threadId,
        authorId,
        content: dto.content
      },
      select: commentRoleSelect(nestId)
    })
  }

  createReply(parentComment: Comment, authorId: string, nestId: string, dto: CommentCreateDto, db: Database = this.prisma) {
    return db.comment.create({
      data: {
        threadId: parentComment.threadId,
        parentId: parentComment.id,
        authorId,
        content: dto.content,
        depth: parentComment.depth + 1,
      },
      select: commentRoleSelect(nestId)
    }).then(async (reply) => {
      await db.comment.update({
        where: { id: parentComment.id },
        data: { replyCount: { increment: 1 } }
      })
      return reply
    })
  }

  async updateById(commentId: string, nestId: string, dto: CommentUpdateDto, db: Database = this.prisma) {
    try {
      return await db.comment.update({
        where: { id: commentId },
        data: { content: dto.content, editedAt: new Date() },
        select: commentRoleSelect(nestId)
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new CommentNotFoundException()
      }

      throw error
    }
  }

  async softDeleteById(commentId: string, deletedById: string, db: Database = this.prisma) {
    try {
      await db.comment.update({
        where: {
          id: commentId
        },
        data: {
          deletedAt: new Date(),
          deletedById
        }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new CommentNotFoundException()
      }

      throw error
    }
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
}
