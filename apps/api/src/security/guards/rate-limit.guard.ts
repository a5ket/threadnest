import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import { RateLimitedException } from 'src/common/exceptions/rate-limited.exception'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException(_context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    throw new RateLimitedException(throttlerLimitDetail.timeToBlockExpire)
  }
}
