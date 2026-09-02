import { Prisma } from 'generated/prisma/client'
import { NestMemberRole } from 'generated/prisma/enums'
import { Database } from 'src/prisma/types/database'
import { NEST_REFERENCE_SELECT } from '../selects/nest-reference.select'
import { NEST_SUMMARY_SELECT } from '../selects/nest.summary.select'
import { NEST_MEMBER_SELECT } from './selects/nest-member.select'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'

export type NestMember = Prisma.NestMemberGetPayload<{ select: typeof NEST_MEMBER_SELECT }>

export type NestMembershipWithNestSummary = Prisma.NestMemberGetPayload<{
  select: { role: true, createdAt: true, nest: { select: typeof NEST_SUMMARY_SELECT } }
}>

export type NestMembershipWithNestReference = Prisma.NestMemberGetPayload<{
  select: { role: true, createdAt: true, nest: { select: typeof NEST_REFERENCE_SELECT } }
}>

export type NestMemberPage = {
  items: NestMember[]
  meta: { nextCursor: string | null, hasMore: boolean }
}

/** Persistence contract for nest memberships. */
export abstract class NestMemberRepository {
  abstract findByUser(nestId: string, userId: string): Promise<NestMember | null>
  abstract getByUser(nestId: string, userId: string): Promise<NestMember>
  abstract exists(nestId: string, userId: string): Promise<boolean>
  abstract listByNestId(nestId: string, query: NestMemberQueryDto): Promise<NestMemberPage>
  abstract deleteByUserId(nestId: string, userId: string, db?: Database): Promise<void>
  abstract deleteIfExistsByUserId(nestId: string, userId: string, db?: Database): Promise<Prisma.BatchPayload>
  abstract updateRole(nestId: string, userId: string, role: NestMemberRole, db?: Database): Promise<NestMember>
  abstract countByRole(userId: string, role: NestMemberRole): Promise<number>
  abstract listMembershipsByUser(userId: string): Promise<NestMembershipWithNestSummary[]>
  abstract listMembershipReferencesByUser(userId: string): Promise<NestMembershipWithNestReference[]>
  abstract createMember(nestId: string, userId: string, db?: Database): Promise<NestMember>
  abstract createOwner(nestId: string, userId: string, db?: Database): Promise<NestMember>
}
