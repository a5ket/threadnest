import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

export const NEST_MEMBER_SELECT = {
  nestId: true,
  userId: true,
  role: true,
  createdAt: true,
  user: { select: USER_REFERENCE_SELECT }
} satisfies Prisma.NestMemberSelect
