import { Prisma } from 'generated/prisma/client'
import { Database } from 'src/prisma/types/database'
import { NEST_SUMMARY_SELECT } from './selects/nest.summary.select'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestQueryDto } from './dto/nest.query.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import type { NestDiscovery } from './types/nest.discovery'

export type NestSummary = Prisma.NestGetPayload<{ select: typeof NEST_SUMMARY_SELECT }>

export type NestDiscoveryPage = {
  items: NestDiscovery[]
  meta: { nextCursor: string | null, hasMore: boolean }
}

export abstract class NestRepository {
  abstract create(dto: NestCreateDto, db?: Database): Promise<NestSummary>
  // Returns soft-deleted nests too — "deleted" and "never existed" are different cases callers need to tell apart.
  abstract getBySlug(nestSlug: string): Promise<NestSummary>
  abstract updateMetadata(nestId: string, dto: NestUpdateDto, db?: Database): Promise<NestSummary>
  abstract updateIconKey(nestId: string, iconKey: string | null): Promise<NestSummary>
  abstract adjustMemberCount(nestId: string, delta: number, db?: Database): Promise<void>
  abstract adjustBalanceCents(nestId: string, delta: number, db?: Database): Promise<void>
  abstract getBalanceCents(nestId: string): Promise<number>
  abstract delete(nestId: string, actorUserId: string): Promise<void>
  abstract adjustThreadCount(nestId: string, delta: number, db?: Database): Promise<void>
  abstract getDeletedAt(nestId: string): Promise<Date | null>
  abstract slugExists(nestSlug: string): Promise<boolean>
  abstract listDiscoverable(query: NestQueryDto, viewerId?: string): Promise<NestDiscoveryPage>
}
