import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ThrottlerStorage } from '@nestjs/throttler'
import Redis from 'ioredis'
import { ThrottlerConfig } from './throttler.config'

// Return values are whole seconds (not ms) — the guard forwards them straight into Retry-After.
const INCREMENT_SCRIPT = `
local blockPttl = redis.call('PTTL', KEYS[2])
if blockPttl > 0 then
  local hits = tonumber(redis.call('GET', KEYS[1]) or '0')
  local hitsPttl = redis.call('PTTL', KEYS[1])
  if hitsPttl < 0 then hitsPttl = 0 end
  return {hits, math.ceil(hitsPttl / 1000), 1, math.ceil(blockPttl / 1000)}
end

local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end

local hitsPttl = redis.call('PTTL', KEYS[1])
if hitsPttl < 0 then hitsPttl = tonumber(ARGV[1]) end

if hits > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], '1', 'PX', ARGV[3])
  return {hits, math.ceil(hitsPttl / 1000), 1, math.ceil(tonumber(ARGV[3]) / 1000)}
end

return {hits, math.ceil(hitsPttl / 1000), 0, 0}
`

/**
 * Redis-backed {@link ThrottlerStorage} so rate limits are shared across all API instances instead
 * of each process tracking its own in-memory counters.
 */
@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private readonly redis: Redis

  constructor(config: ConfigService<ThrottlerConfig>) {
    this.redis = new Redis({
      host: config.getOrThrow('redisHost', { infer: true }),
      port: config.getOrThrow('redisPort', { infer: true }),
      keyPrefix: config.getOrThrow('throttlerKeyPrefix', { infer: true })
    })
  }

  /**
   * Atomically increments the hit counter and evaluates blocking in a single Lua script, so
   * concurrent requests can't race past the limit.
   *
   * @param key - Identifies the caller being throttled (e.g. `user:<id>` or `ip:<addr>`).
   * @param ttl - Window length in seconds before the hit counter resets.
   * @param limit - Hits allowed within `ttl` before blocking kicks in.
   * @param blockDuration - How long (seconds) to block once `limit` is exceeded.
   * @param throttlerName - Namespaces the counter so multiple named throttlers on one key don't collide.
   * @returns Hit count, seconds until the counter expires, whether the caller is now blocked, and
   *   seconds until any block expires.
   */
  async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string) {
    const namespacedKey = `${throttlerName}:${key}`

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = await this.redis.eval(
      INCREMENT_SCRIPT,
      2,
      `${namespacedKey}:hits`,
      `${namespacedKey}:blocked`,
      ttl,
      limit,
      blockDuration
    ) as [number, number, number, number]

    return { totalHits, timeToExpire, isBlocked: isBlocked === 1, timeToBlockExpire }
  }
}
