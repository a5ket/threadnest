import { Injectable } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { Database } from 'src/prisma/types/database'
import { NestSettingsCreateOptions, NestSettingsRepository, NestSettingsSelectResult } from './nest-settings.repository'
import { NestSettingsPrismaRepository } from './nest-settings.prisma.repository'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'

const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Wraps {@link NestSettingsPrismaRepository}, caching `get` — checked on nearly every nest-scoped
 * request. `update` evicts the cache entry so the next read is fresh.
 */
@Injectable()
export class NestSettingsCachedRepository extends NestSettingsRepository {
  constructor(
    private readonly inner: NestSettingsPrismaRepository,
    private readonly cache: CacheService
  ) { super() }

  private cacheKey(nestId: string) {
    return `nest-settings:${nestId}`
  }

  create(nestId: string, options?: NestSettingsCreateOptions, db?: Database) {
    // Nothing to invalidate — no cache entry exists before the first read populates one.
    return this.inner.create(nestId, options, db)
  }

  async get(nestId: string) {
    const key = this.cacheKey(nestId)
    const cached = await this.cache.get<NestSettingsSelectResult>(key)
    if (cached) return cached

    const settings = await this.inner.get(nestId)
    await this.cache.set(key, settings, SETTINGS_CACHE_TTL_MS)
    return settings
  }

  async update(nestId: string, dto: NestSettingsUpdateDto, db?: Database) {
    const settings = await this.inner.update(nestId, dto, db)
    await this.cache.delete(this.cacheKey(nestId))
    return settings
  }
}
