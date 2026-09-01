import { BadRequestException } from '@nestjs/common'
import { NestPayoutErrorCodes } from '../constants/nest-payout.error-codes'

export class PayoutsNotEnabledException extends BadRequestException {
  constructor() {
    super({ code: NestPayoutErrorCodes.PAYOUTS_NOT_ENABLED, message: 'Payouts are not yet enabled for this nest\'s connected account' })
  }
}
