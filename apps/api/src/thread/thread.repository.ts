import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { customAlphabet } from 'nanoid'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { THREAD_SUMMARY_SELECT } from './constants/thread.summary.select'
import { THREAD_DETAILS_SELECT } from './constants/thread.details.select'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadQueryDto, ThreadSortBy } from './dto/thread.query.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'

@Injectable()
export class ThreadRepository {
  private readonly generateSlug = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

  constructor(private readonly prisma: PrismaService) { }

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
        return await db.thread.create({
          data: {
            nestId,
            authorId,
            slug,
            title: dto.title,
            content: dto.content,
            lastCommentAt: now,
          },
          select: THREAD_DETAILS_SELECT,
        })
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
      select: THREAD_DETAILS_SELECT
    })

    if (!thread) {
      throw new ThreadNotFoundException()
    }

    return thread
  }

  async getBySlug(nestId: string, slug: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { nestId_slug: { nestId, slug } },
      select: THREAD_DETAILS_SELECT
    })

    if (!thread) {
      throw new ThreadNotFoundException()
    }

    return thread
  }

  async listByNest(nestId: string, query: ThreadQueryDto) {
    const { limit, cursor, sortBy, sortAscending } = query
    const order = sortAscending ? 'asc' : 'desc'

    let cursorWhere = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        const dateField = sortBy === ThreadSortBy.LAST_COMMENT_AT ? 'lastCommentAt' : sortBy
        cursorWhere = sortAscending
          ? { OR: [{ [dateField]: { gt: date } }, { [dateField]: date, id: { gt: id } }] }
          : { OR: [{ [dateField]: { lt: date } }, { [dateField]: date, id: { lt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const orderBy: { [key: string]: 'asc' | 'desc' }[] = sortBy === ThreadSortBy.LAST_COMMENT_AT
      ? [{ lastCommentAt: order }, { id: order }]
      : sortBy === ThreadSortBy.UPDATED_AT
        ? [{ updatedAt: order }, { id: order }]
        : [{ createdAt: order }, { id: order }]

    const threads = await this.prisma.thread.findMany({
      where: { nestId, deletedAt: null, ...cursorWhere },
      select: THREAD_SUMMARY_SELECT,
      orderBy,
      take: limit + 1
    })

    const hasMore = threads.length > limit
    const items = hasMore ? threads.slice(0, limit) : threads
    const last = items.at(-1)
    const sortField = sortBy === ThreadSortBy.LAST_COMMENT_AT ? last?.lastCommentAt : sortBy === ThreadSortBy.UPDATED_AT ? last?.updatedAt : last?.createdAt
    const nextCursor = last && hasMore ? encodeCursor(sortField ?? last.createdAt, last.id) : null

    return { data: items, pagination: { nextCursor, hasMore } }
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

  async updateById(threadId: string, dto: ThreadUpdateDto) {
    try {
      return await this.prisma.thread.update({
        where: {
          id: threadId,
        },
        data: {
          title: dto.title,
          content: dto.content
        },
        select: THREAD_DETAILS_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  private async setPinnedAt(threadId: string, pinnedAt: Date | null, db: Database = this.prisma) {
    try {
      return await db.thread.update({
        where: { id: threadId },
        data: { pinnedAt },
        select: THREAD_DETAILS_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  async pin(threadId: string, db?: Database) {
    return this.setPinnedAt(threadId, new Date(), db)
  }

  async unpin(threadId: string, db?: Database) {
    return this.setPinnedAt(threadId, null, db)
  }

  private async setLockedAt(threadId: string, lockedAt: Date | null, db: Database = this.prisma) {
    try {
      return await db.thread.update({
        where: { id: threadId },
        data: { lockedAt },
        select: THREAD_DETAILS_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new ThreadNotFoundException()
      }

      throw error
    }
  }

  async lock(threadId: string, db?: Database) {
    return this.setLockedAt(threadId, new Date(), db)
  }

  async unlock(threadId: string, db?: Database) {
    return this.setLockedAt(threadId, null, db)
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
}
