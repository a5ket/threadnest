import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationDataByType } from './types/notification-data'
import { NotificationSummary } from './types/notification.summary'

/** Shapes notifications into API responses. */
@Injectable()
export class NotificationPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * @param notification - The notification to present.
   * @returns The notification's view, with its type-specific `data` payload tagged with `type`
   * so clients can discriminate the union without a separate lookup.
   */
  toResponseView(notification: NotificationSummary): NotificationResponseDto {
    const data = notification.data as NotificationDataByType[keyof NotificationDataByType]

    return {
      id: notification.id,
      type: notification.type,
      actor: notification.actor ? this.userPresenter.toReferenceView(notification.actor) : null,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      data: { type: notification.type, ...data } as NotificationResponseDto['data'],
    }
  }
}
