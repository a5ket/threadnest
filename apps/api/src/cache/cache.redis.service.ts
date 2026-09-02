import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { CacheConfig } from './cache.config'
import { CacheService } from './cache.service'

/**
 * Compare-and-delete: only deletes the key if its current value still matches the expected
 * owner. Must run as a single atomic Lua script — a plain `GET` then `DEL` from application code
 * would race against another process re-acquiring the lock in between the two calls.
 */
const RELEASE_LOCK_SCRIPT = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  end
  return 0
`

/** {@link CacheService} implementation backed by Redis. */
@Injectable()
export class CacheRedisService extends CacheService implements OnModuleDestroy {
  private readonly redis: Redis

  constructor(config: ConfigService<CacheConfig>) {
    super()
    this.redis = new Redis({
      host: config.getOrThrow('redisHost', { infer: true }),
      port: config.getOrThrow('redisPort', { infer: true }),
      keyPrefix: config.getOrThrow('cacheKeyPrefix', { infer: true })
    })
  }

  async get<T>(key: string) {
    const value = await this.redis.get(key)
    return value === null ? null : JSON.parse(value) as T
  }

  async set<T>(key: string, value: T, ttlMs?: number) {
    const serialized = JSON.stringify(value)

    if (ttlMs === undefined) {
      await this.redis.set(key, serialized)
      return
    }

    await this.redis.set(key, serialized, 'PX', ttlMs)
  }

  async delete(key: string) {
    await this.redis.del(key)
  }

  async acquireLock(key: string, owner: string, ttlMs: number) {
    return await this.redis.set(key, owner, 'PX', ttlMs, 'NX') === 'OK'
  }

  async releaseLock(key: string, owner: string) {
    return await this.redis.eval(RELEASE_LOCK_SCRIPT, 1, key, owner) === 1
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }
}
