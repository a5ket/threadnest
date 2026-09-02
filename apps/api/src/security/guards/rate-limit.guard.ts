import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import { RateLimitedException } from 'src/common/exceptions/rate-limited.exception'

/** Swaps @nestjs/throttler's generic 429 for {@link RateLimitedException}, carrying the actual retry-after time. */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  /**
   * @throws {RateLimitedException} Always — this is the hook @nestjs/throttler calls once a
   *   request exceeds its limit.
   */
  protected async throwThrottlingException(_context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    throw new RateLimitedException(throttlerLimitDetail.timeToBlockExpire)
  }
}
