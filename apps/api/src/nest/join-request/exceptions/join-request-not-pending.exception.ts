import { ConflictException } from '@nestjs/common'
import { NestJoinRequestsErrorCodes } from '../constants/nest-join-request.error-codes'

export class JoinRequestNotPendingException extends ConflictException {
  constructor() {
    super({ code: NestJoinRequestsErrorCodes.JOIN_REQUEST_NOT_PENDING, message: 'Join request is not pending' })
  }
}
