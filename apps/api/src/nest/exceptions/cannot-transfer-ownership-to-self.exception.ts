import { BadRequestException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class CannotTransferOwnershipToSelfException extends BadRequestException {
  constructor() {
    super({ code: NestsErrorCodes.CANNOT_TRANSFER_OWNERSHIP_TO_SELF, message: 'Cannot transfer nest ownership to yourself' })
  }
}
