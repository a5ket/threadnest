import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { CacheService } from 'src/cache/cache.service'
import { Database } from 'src/prisma/types/database'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { MemberNotFoundException } from './exceptions/member-not-found.exception'
import { NestMember, NestMemberRepository } from './nest-member.repository'
import { NestMemberPrismaRepository } from './nest-member.prisma.repository'

const MEMBERSHIP_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Wraps {@link NestMemberPrismaRepository}, caching `findByUser` — checked on nearly every
 * nest-scoped request. Every write invalidates the cache entry.
 */
@Injectable()
export class NestMemberCachedRepository extends NestMemberRepository {
  constructor(
    private readonly inner: NestMemberPrismaRepository,
    private readonly cache: CacheService
  ) { super() }

  private cacheKey(nestId: string, userId: string) {
    return `nest-member:${nestId}:${userId}`
  }

  async findByUser(nestId: string, userId: string) {
    const key = this.cacheKey(nestId, userId)
    const cached = await this.cache.get<NestMember | ''>(key)
    if (cached !== null) return cached === '' ? null : cached

    const membership = await this.inner.findByUser(nestId, userId)
    await this.cache.set(key, membership ?? '', MEMBERSHIP_CACHE_TTL_MS)
    return membership
  }

  async getByUser(nestId: string, userId: string) {
    const membership = await this.findByUser(nestId, userId)

    if (!membership) {
      throw new MemberNotFoundException()
    }

    return membership
  }

  exists(nestId: string, userId: string) {
    return this.inner.exists(nestId, userId)
  }

  listByNestId(nestId: string, query: NestMemberQueryDto) {
    return this.inner.listByNestId(nestId, query)
  }

  async deleteByUserId(nestId: string, userId: string, db?: Database) {
    await this.inner.deleteByUserId(nestId, userId, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
  }

  async deleteIfExistsByUserId(nestId: string, userId: string, db?: Database) {
    const result = await this.inner.deleteIfExistsByUserId(nestId, userId, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
    return result
  }

  async updateRole(nestId: string, userId: string, role: NestMemberRole, db?: Database) {
    const membership = await this.inner.updateRole(nestId, userId, role, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
    return membership
  }

  countByRole(userId: string, role: NestMemberRole) {
    return this.inner.countByRole(userId, role)
  }

  listMembershipsByUser(userId: string) {
    return this.inner.listMembershipsByUser(userId)
  }

  listMembershipReferencesByUser(userId: string) {
    return this.inner.listMembershipReferencesByUser(userId)
  }

  async createMember(nestId: string, userId: string, db?: Database) {
    const membership = await this.inner.createMember(nestId, userId, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
    return membership
  }

  async createOwner(nestId: string, userId: string, db?: Database) {
    const membership = await this.inner.createOwner(nestId, userId, db)
    await this.cache.delete(this.cacheKey(nestId, userId))
    return membership
  }
}
