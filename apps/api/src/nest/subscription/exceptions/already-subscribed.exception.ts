import { BadRequestException } from '@nestjs/common'
import { NestSubscriptionErrorCodes } from '../constants/nest-subscription.error-codes'

export class AlreadySubscribedException extends BadRequestException {
  constructor() {
    super({ code: NestSubscriptionErrorCodes.ALREADY_SUBSCRIBED, message: 'You already have an active subscription to this nest' })
  }
}
