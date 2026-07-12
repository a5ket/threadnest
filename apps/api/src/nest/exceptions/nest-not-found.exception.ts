import { NotFoundException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class NestNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestsErrorCodes.NEST_NOT_FOUND, message: 'Nest not found' })
  }
}
