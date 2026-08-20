import { Injectable } from '@nestjs/common'
import { NestVisibility } from 'generated/prisma/enums'
import { Prisma } from 'generated/prisma/client'
import { decodeCursor, decodeNumericCursor, encodeCursor, encodeNumericCursor } from 'src/common/pagination/cursor'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NEST_SUMMARY_SELECT } from './selects/nest.summary.select'
import { nestDiscoverySelect } from './selects/nest.discovery.select'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestQueryDto, NestSortBy } from './dto/nest.query.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestSlugTakenException } from './exceptions/nest-slug-taken.exception'
import type { NestDiscovery, NestDiscoveryRaw } from './types/nest.discovery'

@Injectable()
export class NestRepository {
  constructor(private readonly prisma: PrismaService) { }

  // nestSettings is always created alongside the nest in the same transaction, so it's never actually null.
  private toNestDiscovery(nest: NestDiscoveryRaw): NestDiscovery {
    const { nestSettings, members, nestJoinRequests, ...rest } = nest
    return {
      ...rest,
      visibility: nestSettings!.visibility,
      joinPolicy: nestSettings!.joinPolicy,
      isMember: members.length > 0,
      hasPendingJoinRequest: nestJoinRequests.length > 0
    }
  }

  async create(dto: NestCreateDto, db: Database = this.prisma) {
    try {
      return await db.nest.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          memberCount: 1,
        },
        select: NEST_SUMMARY_SELECT,
      })
    } catch (error) {
      if (this.prisma.isUniqueConstraintError(error, 'slug')) {
        throw new NestSlugTakenException()
      }

      throw error
    }
  }

  // Returns soft-deleted nests too — "deleted" and "never existed" are different cases callers need to tell apart.
  async getBySlug(nestSlug: string) {
    const nest = await this.prisma.nest.findUnique({
      where: { slug: nestSlug },
      select: NEST_SUMMARY_SELECT
    })

    if (!nest) {
      throw new NestNotFoundException()
    }

    return nest
  }

  async updateMetadata(nestId: string, dto: NestUpdateDto, db: Database = this.prisma) {
    try {
      return await db.nest.update({
        where: {
          id: nestId
        },
        data: {
          name: dto.name,
          description: dto.description
        },
        select: NEST_SUMMARY_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestNotFoundException()
      }
      throw error
    }
  }

  async updateIconKey(nestId: string, iconKey: string | null) {
    try {
      return await this.prisma.nest.update({
        where: { id: nestId },
        data: { iconKey },
        select: NEST_SUMMARY_SELECT
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestNotFoundException()
      }
      throw error
    }
  }

  async adjustMemberCount(
    nestId: string,
    delta: number,
    db: Database = this.prisma,
  ) {
    await db.nest.update({
      where: { id: nestId },
      data: {
        memberCount: {
          increment: delta,
        },
      },
    })
  }

  async delete(nestId: string, actorUserId: string) {
    try {
      await this.prisma.nest.update({
        where: { id: nestId },
        data: { deletedAt: new Date(), deletedById: actorUserId }
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestNotFoundException()
      }

      throw error
    }
  }

  async adjustThreadCount(
    nestId: string,
    delta: number,
    db: Database = this.prisma,
  ) {
    await db.nest.update({
      where: { id: nestId },
      data: {
        threadCount: {
          increment: delta,
        },
      },
    })
  }

  async getDeletedAt(nestId: string) {
    const nest = await this.prisma.nest.findUnique({
      where: { id: nestId },
      select: { deletedAt: true }
    })
    return nest?.deletedAt ?? null
  }

  async slugExists(nestSlug: string) {
    const nest = await this.prisma.nest.findUnique({
      where: {
        slug: nestSlug
      },
      select: {
        id: true
      }
    })
    return Boolean(nest)
  }

  async listDiscoverable(query: NestQueryDto, viewerId?: string) {
    const { limit, cursor, sortBy, sortAscending, search } = query
    const order = sortAscending ? 'asc' : 'desc'
    const isMemberCountSort = sortBy === NestSortBy.MEMBER_COUNT

    let cursorWhere = {}

    if (cursor) {
      try {
        if (isMemberCountSort) {
          const { value, id } = decodeNumericCursor(cursor)
          cursorWhere = sortAscending
            ? { OR: [{ memberCount: { gt: value } }, { memberCount: value, id: { gt: id } }] }
            : { OR: [{ memberCount: { lt: value } }, { memberCount: value, id: { lt: id } }] }
        } else {
          const { date, id } = decodeCursor(cursor)
          cursorWhere = sortAscending
            ? { OR: [{ createdAt: { gt: date } }, { createdAt: date, id: { gt: id } }] }
            : { OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }] }
        }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const orderBy: { [key: string]: 'asc' | 'desc' }[] = isMemberCountSort
      ? [{ memberCount: order }, { id: order }]
      : [{ createdAt: order }, { id: order }]

    const visibilityWhere: Prisma.NestWhereInput = {
      OR: [
        { nestSettings: { visibility: NestVisibility.PUBLIC } },
        ...(viewerId ? [{ members: { some: { userId: viewerId } } } satisfies Prisma.NestWhereInput] : [])
      ]
    }

    const nests = await this.prisma.nest.findMany({
      where: {
        deletedAt: null,
        ...visibilityWhere,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
        ...cursorWhere
      },
      select: nestDiscoverySelect(viewerId),
      orderBy,
      take: limit + 1
    })

    const hasMore = nests.length > limit
    const items = (hasMore ? nests.slice(0, limit) : nests).map((n) => this.toNestDiscovery(n))
    const last = items.at(-1)

    let nextCursor: string | null = null
    if (last && hasMore) {
      nextCursor = isMemberCountSort
        ? encodeNumericCursor(last.memberCount, last.id)
        : encodeCursor(last.createdAt, last.id)
    }

    return { items, meta: { nextCursor, hasMore } }
  }
}
