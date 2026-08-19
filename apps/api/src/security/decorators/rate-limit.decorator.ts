import { applyDecorators } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { RateLimitedException } from 'src/common/exceptions/rate-limited.exception'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'

interface RateLimitOptions {
  limit: number
  ttlMs: number
  blockDurationMs?: number
}

export const RateLimit = ({ limit, ttlMs, blockDurationMs }: RateLimitOptions) => applyDecorators(
  Throttle({ default: { limit, ttl: ttlMs, blockDuration: blockDurationMs ?? ttlMs } }),
  ApiExceptionResponses(RateLimitedException)
)
