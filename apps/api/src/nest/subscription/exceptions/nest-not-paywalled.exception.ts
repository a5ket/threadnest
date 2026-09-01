import { BadRequestException } from '@nestjs/common'
import { NestSubscriptionErrorCodes } from '../constants/nest-subscription.error-codes'

export class NestNotPaywalledException extends BadRequestException {
  constructor() {
    super({ code: NestSubscriptionErrorCodes.NEST_NOT_PAYWALLED, message: 'This nest does not require a subscription' })
  }
}
