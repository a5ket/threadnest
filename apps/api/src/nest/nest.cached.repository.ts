import { Injectable } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { Database } from 'src/prisma/types/database'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestQueryDto } from './dto/nest.query.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { NestRepository } from './nest.repository'
import { NestPrismaRepository } from './nest.prisma.repository'

const DELETED_AT_CACHE_TTL_MS = 5 * 60 * 1000

@Injectable()
export class NestCachedRepository extends NestRepository {
  constructor(
    private readonly inner: NestPrismaRepository,
    private readonly cache: CacheService
  ) { super() }

  private deletedAtCacheKey(nestId: string) {
    return `nest-deleted-at:${nestId}`
  }

  create(dto: NestCreateDto, db?: Database) {
    return this.inner.create(dto, db)
  }

  getBySlug(nestSlug: string) {
    return this.inner.getBySlug(nestSlug)
  }

  updateMetadata(nestId: string, dto: NestUpdateDto, db?: Database) {
    return this.inner.updateMetadata(nestId, dto, db)
  }

  updateIconKey(nestId: string, iconKey: string | null) {
    return this.inner.updateIconKey(nestId, iconKey)
  }

  adjustMemberCount(nestId: string, delta: number, db?: Database) {
    return this.inner.adjustMemberCount(nestId, delta, db)
  }

  async delete(nestId: string, actorUserId: string) {
    await this.inner.delete(nestId, actorUserId)
    await this.cache.delete(this.deletedAtCacheKey(nestId))
  }

  adjustThreadCount(nestId: string, delta: number, db?: Database) {
    return this.inner.adjustThreadCount(nestId, delta, db)
  }

  async getDeletedAt(nestId: string) {
    const key = this.deletedAtCacheKey(nestId)
    // '' means "cached: not deleted" — cache.get() returning null must stay reserved for "not cached at all",
    // since deletedAt is legitimately null for the common (not-deleted) case.
    const cached = await this.cache.get<string>(key)
    if (cached !== null) return cached === '' ? null : new Date(cached)

    const deletedAt = await this.inner.getDeletedAt(nestId)
    await this.cache.set(key, deletedAt ? deletedAt.toISOString() : '', DELETED_AT_CACHE_TTL_MS)
    return deletedAt
  }

  slugExists(nestSlug: string) {
    return this.inner.slugExists(nestSlug)
  }

  listDiscoverable(query: NestQueryDto, viewerId?: string) {
    return this.inner.listDiscoverable(query, viewerId)
  }
}
