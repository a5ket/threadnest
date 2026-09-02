import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { EventBus } from 'src/event/event-bus'
import { NotificationCreatedEvent } from './events/notification-created.event'
import { NotificationQueryDto } from './dto/notification.query.dto'
import { NotificationPresenter } from './notification.presenter'
import { NotificationRepository } from './notification.repository'
import { NotificationDataByType } from './types/notification-data'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly presenter: NotificationPresenter,
    private readonly eventBus: EventBus
  ) { }

  /**
   * Creates a notification and publishes {@link NotificationCreatedEvent} for anything else that
   * needs to react to it, in addition to it showing up in {@link listForUser}.
   *
   * @param userId - The recipient.
   * @param actorUserId - The user who triggered the notification, or `null` for a system-generated one.
   * @param nestId - The nest this notification relates to, or `null` if not nest-scoped.
   * @param type - The kind of notification.
   * @param data - Type-specific details, keyed by `type` via {@link NotificationDataByType}.
   * @returns The created notification's view.
   */
  async create<T extends NotificationType>(
    userId: string,
    actorUserId: string | null,
    nestId: string | null,
    type: T,
    data: NotificationDataByType[T]
  ) {
    const notification = await this.notifications.create(userId, actorUserId, nestId, type, data)
    const view = this.presenter.toResponseView(notification)

    void this.eventBus.publish(new NotificationCreatedEvent({ userId, notification: view }))

    return view
  }

  /**
   * @param userId - The recipient whose notifications to list.
   * @param query - Pagination options plus an unread-only filter.
   * @returns A page of notification views.
   * @throws {InvalidCursorException} `query.cursor` is malformed.
   */
  async listForUser(userId: string, query: NotificationQueryDto) {
    const page = await this.notifications.listForUser(userId, query)
    return { items: page.items.map((notification) => this.presenter.toResponseView(notification)), meta: page.meta }
  }

  /**
   * @param userId - The recipient.
   * @returns The count of notifications not yet marked seen, for a badge count.
   */
  getUnseenCount(userId: string) {
    return this.notifications.countUnseen(userId)
  }

  /**
   * @param notificationId - The notification to mark read.
   * @param userId - The recipient.
   * @throws {NotificationNotFoundException} No such notification, or it belongs to another user.
   */
  markAsRead(notificationId: string, userId: string) {
    return this.notifications.markAsRead(notificationId, userId)
  }

  /** @param userId - The recipient whose unread notifications to mark read. */
  markAllAsRead(userId: string) {
    return this.notifications.markAllAsRead(userId)
  }

  /** @param userId - The recipient whose unseen notifications to mark seen. */
  markAllAsSeen(userId: string) {
    return this.notifications.markAllAsSeen(userId)
  }
}
