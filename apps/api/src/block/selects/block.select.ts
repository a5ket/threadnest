import { Prisma } from 'generated/prisma/client'

export const BLOCK_SELECT = {
  blockerId: true,
  blockedId: true,
  createdAt: true
} satisfies Prisma.UserBlockSelect

