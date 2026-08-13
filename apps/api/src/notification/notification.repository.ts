import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { decodeCursor, encodeCursor } from 'src/common/pagination/cursor'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { NotificationQueryDto } from './dto/notification.query.dto'
import { NotificationNotFoundException } from './exceptions/notification-not-found.exception'
import { NOTIFICATION_SELECT } from './selects/notification.select'
import { NotificationDataByType } from './types/notification-data'

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create<T extends NotificationType>(
    userId: string,
    actorUserId: string | null,
    nestId: string | null,
    type: T,
    data: NotificationDataByType[T],
    db: Database = this.prisma
  ) {
    return db.notification.create({
      data: { userId, actorUserId, nestId, type, data },
      select: NOTIFICATION_SELECT
    })
  }

  async listForUser(userId: string, query: NotificationQueryDto) {
    const { limit, cursor, unreadOnly } = query

    let cursorWhere = {}

    if (cursor) {
      try {
        const { date, id } = decodeCursor(cursor)
        cursorWhere = { OR: [{ createdAt: { lt: date } }, { createdAt: date, id: { lt: id } }] }
      } catch {
        throw new InvalidCursorException()
      }
    }

    const notifications = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}), ...cursorWhere },
      select: NOTIFICATION_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, limit) : notifications
    const last = items.at(-1)
    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.id) : null

    return { items, meta: { nextCursor, hasMore } }
  }

  countUnseen(userId: string) {
    return this.prisma.notification.count({ where: { userId, seenAt: null } })
  }

  async markAsRead(notificationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() }
    })

    if (result.count === 0) {
      throw new NotificationNotFoundException()
    }
  }

  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    })
  }

  markAllAsSeen(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, seenAt: null },
      data: { seenAt: new Date() }
    })
  }
}
