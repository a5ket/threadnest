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

/**
 * Persistence for user notifications. Tracks two independent timestamps: `seenAt` (the user
 * glanced at their notification list/bell — see {@link markAllAsSeen}) and `readAt` (the user
 * opened this specific notification — see {@link markAsRead}/{@link markAllAsRead}).
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param userId - The recipient.
   * @param actorUserId - The user who triggered the notification, or `null` for a system-generated one.
   * @param nestId - The nest this notification relates to, or `null` if not nest-scoped.
   * @param type - The kind of notification.
   * @param data - Type-specific details, keyed by `type` via {@link NotificationDataByType}.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created notification.
   */
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

  /**
   * @param userId - The recipient whose notifications to list.
   * @param query - Pagination options plus an unread-only filter.
   * @returns A cursor-paginated page of notifications, newest first.
   * @throws {InvalidCursorException} `query.cursor` is malformed.
   */
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

  /**
   * @param userId - The recipient.
   * @returns The count of notifications not yet marked seen — typically shown as a badge count.
   */
  countUnseen(userId: string) {
    return this.prisma.notification.count({ where: { userId, seenAt: null } })
  }

  /**
   * @param notificationId - The notification to mark read.
   * @param userId - The recipient; scopes the update so a user can't mark someone else's
   * notification read.
   * @throws {NotificationNotFoundException} No such notification, or it belongs to another user.
   */
  async markAsRead(notificationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() }
    })

    if (result.count === 0) {
      throw new NotificationNotFoundException()
    }
  }

  /** @param userId - The recipient whose unread notifications to mark read. */
  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    })
  }

  /** @param userId - The recipient whose unseen notifications to mark seen. */
  markAllAsSeen(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, seenAt: null },
      data: { seenAt: new Date() }
    })
  }
}
