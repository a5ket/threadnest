import { Prisma } from 'generated/prisma/client'

export const USER_AUTH_SELECT = {
  id: true,
  email: true,
  emailVerifiedAt: true,
  passwordHash: true,
  createdAt: true,
  profile: {
    select: {
      username: true,
      avatarKey: true
    }
  }
} satisfies Prisma.UserSelect
