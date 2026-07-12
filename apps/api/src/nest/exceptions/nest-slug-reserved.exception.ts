import { BadRequestException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class NestSlugReservedException extends BadRequestException {
  constructor() {
    super({ code: NestsErrorCodes.NEST_SLUG_RESERVED, message: 'Slug is reserved' })
  }
}
