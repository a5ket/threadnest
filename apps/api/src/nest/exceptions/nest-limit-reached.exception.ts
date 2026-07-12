import { UnprocessableEntityException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class NestLimitReachedException extends UnprocessableEntityException {
  constructor() {
    super({ code: NestsErrorCodes.NEST_LIMIT_REACHED, message: 'Reached nests limit' })
  }
}
