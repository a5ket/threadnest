import { Prisma } from 'generated/prisma/client'
import { NEST_INVITE_SUMMARY_SELECT } from '../constants/nest-invite.summary.select'

export type NestInviteSummary = Prisma.NestInviteGetPayload<{ select: typeof NEST_INVITE_SUMMARY_SELECT }>