import { Prisma } from 'generated/prisma/client'
import { NEST_JOIN_REQUEST_SELECT } from '../selects/nest-join-request.select'

export type NestJoinRequest = Prisma.NestJoinRequestGetPayload<{ select: typeof NEST_JOIN_REQUEST_SELECT }>