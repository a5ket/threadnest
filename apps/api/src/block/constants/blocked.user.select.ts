import { Prisma } from 'generated/prisma/client'

export const BLOCKED_USER_SELECT = {
  createdAt: true,
  blocked: {
    select: {
      id: true,
      profile: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  }
} satisfies Prisma.UserBlockSelect