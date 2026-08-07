import { Prisma } from 'generated/prisma/client'
import { NEST_JOIN_REQUEST_PERSONAL_SELECT } from '../selects/nest-join-request.personal.select'

export type NestJoinRequestPersonal = Prisma.NestJoinRequestGetPayload<{
  select: typeof NEST_JOIN_REQUEST_PERSONAL_SELECT
}>