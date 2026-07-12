import { ConflictException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class NestSlugTakenException extends ConflictException {
  constructor() {
    super({ code: NestsErrorCodes.NEST_SLUG_TAKEN, message: 'Slug already exists' })
  }
}
