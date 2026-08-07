import { Prisma } from 'generated/prisma/client'
import { NEST_JOIN_REQUEST_SUMMARY_SELECT } from '../selects/nest-join-request.summary.select'

export type NestJoinRequestSummary = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_SUMMARY_SELECT }>