import { ConflictException } from '@nestjs/common'
import { NestJoinRequestsErrorCodes } from '../constants/nest-join-request.error-codes'

export class AlreadyHasPendingJoinRequestException extends ConflictException {
  constructor() {
    super({ code: NestJoinRequestsErrorCodes.ALREADY_HAS_PENDING_JOIN_REQUEST, message: 'Already has pending join request' })
  }
}