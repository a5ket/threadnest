import { Prisma } from 'generated/prisma/client'
import { NEST_INVITE_MANAGEMENT_SELECT } from '../constants/nest-invite.management.select'

export type NestInviteDetails = Prisma.NestInviteGetPayload<{ select: typeof NEST_INVITE_MANAGEMENT_SELECT }>