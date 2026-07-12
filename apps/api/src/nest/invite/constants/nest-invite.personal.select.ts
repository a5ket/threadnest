import { Prisma } from 'generated/prisma/client'
import { NEST_REFERENCE_SELECT } from 'src/nest/constants/nest-reference.select'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

export const NEST_INVITE_PERSONAL_SELECT = {
  id: true,
  userId: true,
  status: true,
  message: true,
  createdAt: true,
  resolvedAt: true,

  nest: {
    select: NEST_REFERENCE_SELECT
  },

  invitedBy: {
    select: USER_REFERENCE_SELECT
  },

  resolvedBy: {
    select: USER_REFERENCE_SELECT
  }
} satisfies Prisma.NestInviteSelect