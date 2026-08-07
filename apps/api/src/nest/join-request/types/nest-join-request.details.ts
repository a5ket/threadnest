import { Prisma } from 'generated/prisma/client'
import { NEST_JOIN_REQUEST_MANAGEMENT_SELECT } from '../selects/nest-join-request.management.select'

export type NestJoinRequestDetails = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_MANAGEMENT_SELECT }>
