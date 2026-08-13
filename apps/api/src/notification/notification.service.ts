import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { NotificationQueryDto } from './dto/notification.query.dto'
import { NotificationPresenter } from './notification.presenter'
import { NotificationRepository } from './notification.repository'
import { NotificationDataByType } from './types/notification-data'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly presenter: NotificationPresenter
  ) { }

  async create<T extends NotificationType>(
    userId: string,
    actorUserId: string | null,
    nestId: string | null,
    type: T,
    data: NotificationDataByType[T]
  ) {
    const notification = await this.notifications.create(userId, actorUserId, nestId, type, data)
    return this.presenter.toResponseView(notification)
  }

  async listForUser(userId: string, query: NotificationQueryDto) {
    const page = await this.notifications.listForUser(userId, query)
    return { items: page.items.map((notification) => this.presenter.toResponseView(notification)), meta: page.meta }
  }

  getUnseenCount(userId: string) {
    return this.notifications.countUnseen(userId)
  }

  markAsRead(notificationId: string, userId: string) {
    return this.notifications.markAsRead(notificationId, userId)
  }

  markAllAsRead(userId: string) {
    return this.notifications.markAllAsRead(userId)
  }

  markAllAsSeen(userId: string) {
    return this.notifications.markAllAsSeen(userId)
  }
}
