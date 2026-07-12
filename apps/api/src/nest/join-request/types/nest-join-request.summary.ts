import { Prisma } from 'generated/prisma/client'
import { NEST_JOIN_REQUEST_SUMMARY_SELECT } from '../constants/nest-join-request.summary.select'

export type NestJoinRequestSummary = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_SUMMARY_SELECT }>