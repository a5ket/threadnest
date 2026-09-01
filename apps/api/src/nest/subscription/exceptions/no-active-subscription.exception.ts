import { BadRequestException } from '@nestjs/common'
import { NestSubscriptionErrorCodes } from '../constants/nest-subscription.error-codes'

export class NoActiveSubscriptionException extends BadRequestException {
  constructor() {
    super({ code: NestSubscriptionErrorCodes.NO_ACTIVE_SUBSCRIPTION, message: 'You don\'t have an active subscription to this nest' })
  }
}
