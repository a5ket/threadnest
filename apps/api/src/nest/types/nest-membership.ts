import { Prisma } from 'generated/prisma/client'
import { NEST_MEMBER_SELECT } from '../member/selects/nest-member.select'

export type NestMembership = Prisma.NestMemberGetPayload<{ select: typeof NEST_MEMBER_SELECT }>