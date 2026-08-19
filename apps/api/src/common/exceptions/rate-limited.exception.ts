import { HttpException, HttpStatus } from '@nestjs/common'
import { CommonErrorCodes } from '../constants/common.error-codes'

export class RateLimitedException extends HttpException {
  constructor(retryAfterSeconds = 60) {
    super(
      { code: CommonErrorCodes.RATE_LIMITED, message: 'Too many requests, please try again later', retryAfterSeconds },
      HttpStatus.TOO_MANY_REQUESTS
    )
  }
}
