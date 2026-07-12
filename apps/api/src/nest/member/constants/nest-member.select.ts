import { Prisma } from 'generated/prisma/client'

export const NEST_MEMBER_SELECT = {
  nestId: true,
  userId: true,
  role: true,
  createdAt: true
} satisfies Prisma.NestMemberSelect