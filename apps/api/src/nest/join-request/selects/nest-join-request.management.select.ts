import { Prisma } from 'generated/prisma/client'
import { NEST_REFERENCE_SELECT } from 'src/nest/selects/nest-reference.select'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const NEST_JOIN_REQUEST_MANAGEMENT_SELECT = {
  id: true,
  status: true,
  message: true,
  resolvedAt: true,
  nest: {
    select: NEST_REFERENCE_SELECT
  },
  user: {
    select: USER_REFERENCE_SELECT
  },
  resolvedBy: {
    select: USER_REFERENCE_SELECT,
  },
  createdAt: true
} satisfies Prisma.NestJoinRequestSelect