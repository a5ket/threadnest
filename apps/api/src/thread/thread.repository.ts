import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { NestMemberRole, VoteType } from 'generated/prisma/enums'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { customAlphabet } from 'nanoid'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { decodeCursor, decodeNumericCursor, encodeCursor, encodeNumericCursor } from 'src/common/pagination/cursor'
import { threadSummarySelect } from './selects/thread.summary.select'
import { threadDetailsSelect } from './selects/thread.details.select'
import { THREAD_POLICY_SUBJECT_SELECT } from './selects/thread.policy-subject.select'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadQueryDto, ThreadSortBy } from './dto/thread.query.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import type { ThreadSummary } from './types/thread.summary'

type ThreadSearchRow = {
  id: string
  title: string
  slug: string
  createdAt: Date
  updatedAt: Date
  lastCommentAt: Date | null
  commentCount: number
  score: number
  lockedAt: Date | null
  pinnedAt: Date | null
  authorId: string
  rank: number
  authorUsername: string | null
  authorDisplayName: string | null
  authorAvatarUrl: string | null
  authorRole: NestMemberRole | null
  viewerVote: VoteType | null
}

type ThreadSearchGlobalRow = ThreadSearchRow & {
  nestId: string
  nestName: string
  nestSlug: string
}

export type ThreadSearchResult = ThreadSummary & { nest: { name: string, slug: string } }

@Injectable()
export class ThreadRepository {
  private readonly generateSlug = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

  constructor(private readonly prisma: PrismaService) { }

  private toThreadWithVote<T extends { threadVotes: { type: VoteType }[] }>(
    thread: T,
  ): Omit<T, 'threadVotes'> & { viewerVote: VoteType | null } {
    const { threadVotes, ...rest } = thread
    return { ...rest, viewerVote: threadVotes[0]?.type ?? null }
  }

  async create(
    nestId: string,
    authorId: string,
    dto: ThreadCreateDto,
    db: Database = this.prisma,
  ) {
    const MAX_RETRIES = 3

    for (let i = 0; i < MAX_RETRIES; i++) {
      const slug = this.generateSlug()
      const now = new Date()

      try {
        const thread = await db.thread.create({
          data: {
            nestId,
            authorId,
            slug,
            title: dto.title,
            content: dto.content,
            lastCommentAt: now,
          },
          select: threadDetailsSelect(nestId, authorId),
        })
        return this.toThreadWithVote(thread)
      } catch (error) {
        if (this.prisma.isUniqueConstraintError(error, 'slug')) {
          continue
        }

        throw error
      }
    }

    throw new InternalServerErrorException('Error creating thread')
  }

  async getById(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: THREAD_POLICY_SUBJECT_SELECT
    })

    if (!thread) {
      throw new ThreadNotFoundException()
    }

    return thread
  }

  async getBySlug(nestId: string, slug: string, viewerId?: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { nestId_slug: { nestId, slug } },
      select: threadDetailsSelect(nestId, viewerId)
    })

    if (!thread) {
      throw new ThreadNotFoundException()
    }

    return this.toThreadWithVote(thread)
  }

  private toThreadSearchResult(row: ThreadSearchRow): ThreadSummary {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastCommentAt: row.lastCommentAt,
      commentCount: row.commentCount,
      score: row.score,
      lockedAt: row.lockedAt,
      pinnedAt: row.pinnedAt,
      author: {
        id: row.authorId,
        profile: row.authorUsername
          ? { username: row.authorUsername, displayName: row.authorDisplayName, avatarUrl: row.authorAvatarUrl }
          : null,
        nestMembership: row.authorRole ? [{ role: row.authorRole }] : [],
      },
      viewerVote: row.viewerVote,
    }
  }

  // No stored tsvector/GIN index yet - fine at nest scale, revisit if search gets slow.
  private async searchByNest(nestId: string, limit: number, cursor: string | undefined, term: string, viewerId?: string) {
    let cursorSql = Prisma.sql`TRUE`

    if (cursor) {
      try {
        const { value, id } = decodeNumericCursor(cursor)
        cursorSql = Prisma.sql`(r.rank < ${value}) OR (r.rank = ${value} AND r.id < ${id})`
      } catch {
        throw new InvalidCursorException()
      }
    }

    const rows = await this.prisma.$queryRaw<ThreadSearchRow[]>(Prisma.sql`
      WITH ranked AS (
        SELECT
          t.id, t.title, t.slug, t."createdAt", t."updatedAt", t."lastCommentAt",
          t."commentCount", t.score, t."lockedAt", t."pinnedAt", t."authorId",
          ts_rank(
            to_tsvector('english', t.title || ' ' || coalesce(t.content, '')),
            plainto_tsquery('english', ${term})
          ) AS rank
        FROM "Thread" t
        WHERE t."nestId" = ${nestId}
          AND t."deletedAt" IS NULL
          AND to_tsvector('english', t.title || ' ' || coalesce(t.content, '')) @@ plainto_tsquery('english', ${term})
      )
      SELECT
        r.*,
        up.username AS "authorUsername",
        up."displayName" AS "authorDisplayName",
        up."avatarUrl" AS "authorAvatarUrl",
        nm.role AS "authorRole",
        tv.type AS "viewerVote"
      FROM ranked r
      LEFT JOIN "UserProfile" up ON up."userId" = r."authorId"
      LEFT JOIN "NestMember" nm ON nm."userId" = r."authorId" AND nm."nestId" = ${nestId}
      LEFT JOIN "ThreadVote" tv ON tv."threadId" = r.id AND tv."userId" = ${viewerId ?? ''}
      WHERE ${cursorSql}
      ORDER BY r.rank DESC, r.id DESC
      LIMIT ${limit + 1}
    `)

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const items = page.map((row) => this.toThreadSearchResult(row))
    const last = page.at(-1)

    const nextCursor = last && hasMore ? encodeNumericCursor(last.rank, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  private toGlobalThreadSearchResult(row: ThreadSearchGlobalRow): ThreadSearchResult {
    return {
      ...this.toThreadSearchResult(row),
      nest: { name: row.nestName, slug: row.nestSlug },
    }
  }

  // Cross-nest, so results are gated by the same visibility-or-membership rule as nest discovery (see nest.access.ts).
  async searchGlobal(term: string, limit: number, cursor: string | undefined, viewerId?: string) {
    let cursorSql = Prisma.sql`TRUE`

    if (cursor) {
      try {
        const { value, id } = decodeNumericCursor(cursor)
        cursorSql = Prisma.sql`(r.rank < ${value}) OR (r.rank = ${value} AND r.id < ${id})`
      } catch {
        throw new InvalidCursorException()
      }
    }

    const visibilitySql = viewerId
      ? Prisma.sql`(ns.visibility = 'PUBLIC' OR EXISTS (SELECT 1 FROM "NestMember" vm WHERE vm."nestId" = t."nestId" AND vm."userId" = ${viewerId}))`
      : Prisma.sql`ns.visibility = 'PUBLIC'`

    const rows = await this.prisma.$queryRaw<ThreadSearchGlobalRow[]>(Prisma.sql`
      WITH ranked AS (
        SELECT
          t.id, t.title, t.slug, t."createdAt", t."updatedAt", t."lastCommentAt",
          t."commentCount", t.score, t."lockedAt", t."pinnedAt", t."authorId", t."nestId",
          ts_rank(
            to_tsvector('english', t.title || ' ' || coalesce(t.content, '')),
            plainto_tsquery('english', ${term})
          ) AS rank
        FROM "Thread" t
        JOIN "NestSettings" ns ON ns."nestId" = t."nestId"
        WHERE t."deletedAt" IS NULL
          AND to_tsvector('english', t.title || ' ' || coalesce(t.content, '')) @@ plainto_tsquery('english', ${term})
          AND ${visibilitySql}
      )
      SELECT
        r.*,
        n.name AS "nestName",
        n.slug AS "nestSlug",
        up.username AS "authorUsername",
        up."displayName" AS "authorDisplayName",
        up."avatarUrl" AS "authorAvatarUrl",
        nm.role AS "authorRole",
        tv.type AS "viewerVote"
      FROM ranked r
      JOIN "Nest" n ON n.id = r."nestId"
      LEFT JOIN "UserProfile" up ON up."userId" = r."authorId"
      LEFT JOIN "NestMember" nm ON nm."userId" = r."authorId" AND nm."nestId" = r."nestId"
      LEFT JOIN "ThreadVote" tv ON tv."threadId" = r.id AND tv."userId" = ${viewerId ?? ''}
      WHERE ${cursorSql}
      ORDER BY r.rank DESC, r.id DESC
      LIMIT ${limit + 1}
    `)

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const items = page.map((row) => this.toGlobalThreadSearchResult(row))
    const last = page.at(-1)

    const nextCursor = last && hasMore ? encodeNumericCursor(last.rank, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  async listByNest(nestId: string, query: ThreadQueryDto, viewerId?: string) {
    const search = query.search?.trim()
    if (search) {
      return this.searchByNest(nestId, query.limit, query.cursor, search, viewerId)
    }

    const { limit, cursor, sortBy, sortAscending } = query
    const order = sortAscending ? 'asc' : 'desc'
    const isScoreSort = sortBy === ThreadSortBy.SCORE

    let cursorWhere = {}

    if (cursor) {
      try {
        if (isScoreSort) {
          const { value, id } = decodeNumericCursor(cursor)
          cursorWhere = sortAscending
            ? { OR: [{ score: { gt: value } }, { score: value, id: { gt: id } }] }
            : { OR: [{ score: { lt: value } }, { score: value, id: { lt: id } }] }
        } else {
          const { date, id } = decodeCursor(cursor)
          const dateField = sortBy === ThreadSortBy.LAST_COMMENT_AT ? 'lastCommentAt' : sortBy
          cursorWhere = sortAscending
            ? { OR: [{ [dateField]: { gt: date } }, { [dateField]: date, id: { gt: id } }] }
            : { OR: [{ [dateField]: { lt: date } }, { [dateField]: date, id: { lt: id } }] }
        }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const orderBy: { [key: string]: 'asc' | 'desc' }[] = isScoreSort
      ? [{ score: order }, { id: order }]
      : sortBy === ThreadSortBy.LAST_COMMENT_AT
        ? [{ lastCommentAt: order }, { id: order }]
        : sortBy === ThreadSortBy.UPDATED_AT
          ? [{ updatedAt: order }, { id: order }]
          : [{ createdAt: order }, { id: order }]

    const threads = await this.prisma.thread.findMany({
      where: { nestId, deletedAt: null, ...cursorWhere },
      select: threadSummarySelect(nestId, viewerId),
      orderBy,
      take: limit + 1
    })

    const hasMore = threads.length > limit
    const items = (hasMore ? threads.slice(0, limit) : threads).map((t) => this.toThreadWithVote(t))
    const last = items.at(-1)

    let nextCursor: string | null = null
    if (last && hasMore) {
      if (isScoreSort) {
        nextCursor = encodeNumericCursor(last.score, last.id)
      } else {
        const sortField = sortBy === ThreadSortBy.LAST_COMMENT_AT ? last.lastCommentAt : sortBy === ThreadSortBy.UPDATED_AT ? last.updatedAt : last.createdAt
        nextCursor = encodeCursor(sortField ?? last.createdAt, last.id)
      }
    }

    return { items, meta: { nextCursor, hasMore } }
  }

  async softDelete(threadId: string, deletedById: string, db: Database = this.prisma) {
    try {
      await db.thread.update({
        where: {
          id: threadId
        },
        data: {
          deletedAt: new Date(),
          deletedById
        }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  async updateById(threadId: string, nestId: string, dto: ThreadUpdateDto, viewerId?: string) {
    try {
      const thread = await this.prisma.thread.update({
        where: {
          id: threadId,
        },
        data: {
          title: dto.title,
          content: dto.content
        },
        select: threadDetailsSelect(nestId, viewerId)
      })
      return this.toThreadWithVote(thread)
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  private async setPinnedAt(threadId: string, nestId: string, pinnedAt: Date | null, viewerId?: string, db: Database = this.prisma) {
    try {
      const thread = await db.thread.update({
        where: { id: threadId },
        data: { pinnedAt },
        select: threadDetailsSelect(nestId, viewerId)
      })
      return this.toThreadWithVote(thread)
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  async pin(threadId: string, nestId: string, viewerId?: string, db?: Database) {
    return this.setPinnedAt(threadId, nestId, new Date(), viewerId, db)
  }

  async unpin(threadId: string, nestId: string, viewerId?: string, db?: Database) {
    return this.setPinnedAt(threadId, nestId, null, viewerId, db)
  }

  private async setLockedAt(threadId: string, nestId: string, lockedAt: Date | null, viewerId?: string, db: Database = this.prisma) {
    try {
      const thread = await db.thread.update({
        where: { id: threadId },
        data: { lockedAt },
        select: threadDetailsSelect(nestId, viewerId)
      })
      return this.toThreadWithVote(thread)
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  async lock(threadId: string, nestId: string, viewerId?: string, db?: Database) {
    return this.setLockedAt(threadId, nestId, new Date(), viewerId, db)
  }

  async unlock(threadId: string, nestId: string, viewerId?: string, db?: Database) {
    return this.setLockedAt(threadId, nestId, null, viewerId, db)
  }

  async adjustCommentCount(
    threadId: string,
    delta: number,
    db: Database = this.prisma,
  ) {
    await db.thread.update({
      where: { id: threadId },
      data: {
        commentCount: {
          increment: delta,
        },
      },
    })
  }

  async updateLastCommentAt(
    threadId: string,
    lastCommentAt: Date,
    db: Database = this.prisma,
  ) {
    await db.thread.update({
      where: { id: threadId },
      data: { lastCommentAt },
    })
  }

  async adjustScore(threadId: string, delta: number, nestId: string, viewerId?: string, db: Database = this.prisma) {
    const thread = await db.thread.update({
      where: { id: threadId },
      data: { score: { increment: delta } },
      select: threadDetailsSelect(nestId, viewerId)
    })
    return this.toThreadWithVote(thread)
  }
}
