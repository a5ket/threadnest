import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NestActionLogQueryDto } from './dto/nest-action-log.query.dto'
import { NEST_ACTION_LOG_SELECT } from './selects/nest-action-log.select'
import { NestActionLogDataByType } from './types/nest-action-log-data'

/** Persistence for a nest's moderation action log. */
@Injectable()
export class NestActionLogRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create<T extends NestActionType>(
    nestId: string,
    actorId: string,
    targetUserId: string | null,
    type: T,
    data: NestActionLogDataByType[T],
    db: Database = this.prisma
  ) {
    return db.nestActionLog.create({
      data: { nestId, actorId, targetUserId, type, data },
      select: NEST_ACTION_LOG_SELECT
    })
  }

  async listByNest(nestId: string, query: NestActionLogQueryDto) {
    const { limit, cursor } = query

    let cursorWhere = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        cursorWhere = { OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const logs = await this.prisma.nestActionLog.findMany({
      where: { nestId, ...cursorWhere },
      select: NEST_ACTION_LOG_SELECT,
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
