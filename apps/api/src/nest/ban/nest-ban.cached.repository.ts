import { Injectable } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { Database } from 'src/prisma/types/database'
import { NestBanRepository } from './nest-ban.repository'
import { NestBanPrismaRepository } from './nest-ban.prisma.repository'

const BAN_STATUS_CACHE_TTL_MS = 5 * 60 * 1000

@Injectable()
export class NestBanCachedRepository extends NestBanRepository {
  constructor(
    private readonly inner: NestBanPrismaRepository,
    private readonly cache: CacheService
  ) { super() }

  private cacheKey(nestId: string, userId: string) {
    return `nest-ban-active:${nestId}:${userId}`
  }

  findByNestIdAndUserId(nestId: string, userId: string) {
    return this.inner.findByNestIdAndUserId(nestId, userId)
  }

  async existsActive(nestId: string, userId: string) {
    const key = this.cacheKey(nestId, userId)
    const cached = await this.cache.get<boolean>(key)
    if (cached !== null) return cached

    const exists = await this.inner.existsActive(nestId, userId)
    await this.cache.set(key, exists, BAN_STATUS_CACHE_TTL_MS)
    return exists
  }

  async create(nestId: string, userId: string, bannedById: string, db?: Database) {
    const ban = await this.inner.create(nestId, userId, bannedById, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
    return ban
  }

  async revoke(nestId: string, userId: string, revokedById: string, db?: Database) {
    await this.inner.revoke(nestId, userId, revokedById, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
  }

  listSummaryByNestId(nestId: string) {
    return this.inner.listSummaryByNestId(nestId)
  }
}
