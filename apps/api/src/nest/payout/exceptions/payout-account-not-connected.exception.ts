import { BadRequestException } from '@nestjs/common'
import { NestPayoutErrorCodes } from '../constants/nest-payout.error-codes'

export class PayoutAccountNotConnectedException extends BadRequestException {
  constructor() {
    super({ code: NestPayoutErrorCodes.PAYOUT_ACCOUNT_NOT_CONNECTED, message: 'This nest has no payout account connected' })
  }
}
