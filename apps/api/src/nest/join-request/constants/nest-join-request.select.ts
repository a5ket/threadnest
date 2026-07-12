import { Prisma } from 'generated/prisma/client'

export const NEST_JOIN_REQUEST_SELECT = {
  id: true,
  nestId: true,
  userId: true,
  status: true,
  resolvedAt: true,
  resolvedById: true,
  createdAt: true
} satisfies Prisma.NestJoinRequestSelect