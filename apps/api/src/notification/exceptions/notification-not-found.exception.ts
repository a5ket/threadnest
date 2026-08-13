import { NotFoundException } from '@nestjs/common'
import { NotificationErrorCodes } from '../constants/notification.error-codes'

export class NotificationNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NotificationErrorCodes.NOTIFICATION_NOT_FOUND, message: 'Notification not found' })
  }
}
