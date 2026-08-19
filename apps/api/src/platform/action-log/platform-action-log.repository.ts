import { Injectable } from '@nestjs/common'
import { Prisma } from 'generated/prisma/client'
import { PlatformActionType } from 'generated/prisma/enums'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { PlatformActionLogQueryDto } from './dto/platform-action-log.query.dto'
import { PLATFORM_ACTION_LOG_SELECT } from './selects/platform-action-log.select'
import { PlatformActionLogDataByType } from './types/platform-action-log-data'

@Injectable()
export class PlatformActionLogRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create<T extends PlatformActionType>(
    actorId: string,
    targetUserId: string | null,
    nestId: string | null,
    type: T,
    data: PlatformActionLogDataByType[T],
    db: Database = this.prisma
  ) {
    return db.platformActionLog.create({
      data: { actorId, targetUserId, nestId, type, data },
      select: PLATFORM_ACTION_LOG_SELECT
    })
  }

  async list(query: PlatformActionLogQueryDto) {
    const { limit, cursor, type, actorId, targetUserId, nestId, createdAfter, createdBefore } = query

    let cursorWhere: Prisma.PlatformActionLogWhereInput = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        cursorWhere = { OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const where: Prisma.PlatformActionLogWhereInput = {
      ...cursorWhere,
      ...(type ? { type } : {}),
      ...(actorId ? { actorId } : {}),
      ...(targetUserId ? { targetUserId } : {}),
      ...(nestId ? { nestId } : {}),
      ...(createdAfter || createdBefore ? {
        createdAt: {
          ...(createdAfter ? { gte: createdAfter } : {}),
          ...(createdBefore ? { lte: createdBefore } : {})
        }
      } : {})
    }

    const logs = await this.prisma.platformActionLog.findMany({
      where,
      select: PLATFORM_ACTION_LOG_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1
    })

    const hasMore = logs.length > limit
    const items = hasMore ? logs.slice(0, limit) : logs
    const last = items.at(-1)
    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }
}
