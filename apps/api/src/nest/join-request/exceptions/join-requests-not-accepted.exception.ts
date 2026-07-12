import { ConflictException } from '@nestjs/common'
import { NestJoinRequestsErrorCodes } from '../constants/nest-join-request.error-codes'

export class JoinRequestsNotAcceptedException extends ConflictException {
  constructor() {
    super({ code: NestJoinRequestsErrorCodes.JOIN_REQUESTS_NOT_ACCEPTED, message: 'This nest does not accept join requests' })
  }
}
