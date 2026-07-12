import { NotFoundException } from '@nestjs/common'
import { NestJoinRequestsErrorCodes } from '../constants/nest-join-request.error-codes'

export class NestJoinRequestNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestJoinRequestsErrorCodes.JOIN_REQUEST_NOT_FOUND, message: 'Nest join request not found' })
  }
}