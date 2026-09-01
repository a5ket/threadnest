import { BadRequestException } from '@nestjs/common'
import { NestPayoutErrorCodes } from '../constants/nest-payout.error-codes'

export class NothingToWithdrawException extends BadRequestException {
  constructor() {
    super({ code: NestPayoutErrorCodes.NOTHING_TO_WITHDRAW, message: 'This nest has no balance to withdraw' })
  }
}
