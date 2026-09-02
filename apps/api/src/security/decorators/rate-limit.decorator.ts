import { applyDecorators } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { RateLimitedException } from 'src/common/exceptions/rate-limited.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'

interface RateLimitOptions {
  limit: number
  ttlMs: number
  blockDurationMs?: number
}

/**
 * Caps a route to `limit` requests per `ttlMs`, blocking further requests for `blockDurationMs`
 * (defaults to `ttlMs`) once exceeded. Tracked per-user when authenticated, per-IP otherwise —
 * see {@link createHybridTracker}.
 *
 * @param options - `limit`/`ttlMs` define the window; `blockDurationMs` optionally overrides how
 *   long a request stays blocked once it exceeds the limit.
 */
export const RateLimit = ({ limit, ttlMs, blockDurationMs }: RateLimitOptions) => applyDecorators(
  Throttle({ default: { limit, ttl: ttlMs, blockDuration: blockDurationMs ?? ttlMs } }),
  ApiExceptionResponses(RateLimitedException)
)
