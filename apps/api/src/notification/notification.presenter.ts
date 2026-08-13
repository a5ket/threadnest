import { Injectable } from '@nestjs/common'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationDataByType } from './types/notification-data'
import { NotificationSummary } from './types/notification.summary'

@Injectable()
export class NotificationPresenter {
  toResponseView(notification: NotificationSummary): NotificationResponseDto {
    const data = notification.data as NotificationDataByType[keyof NotificationDataByType]

    return {
      id: notification.id,
      type: notification.type,
      actor: notification.actor,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      data: { type: notification.type, ...data } as NotificationResponseDto['data'],
    }
  }
}
