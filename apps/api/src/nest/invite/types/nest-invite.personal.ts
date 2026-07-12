import { Prisma } from 'generated/prisma/client'
import { NEST_INVITE_PERSONAL_SELECT } from '../constants/nest-invite.personal.select'

export type NestInvitePersonal = Prisma.NestInviteGetPayload<{
  select: typeof NEST_INVITE_PERSONAL_SELECT
}>