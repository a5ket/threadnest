import { Prisma } from 'generated/prisma/client'

export const USER_PROFILE_SELECT = {
  username: true,
  displayName: true,
  bio: true,
  avatarKey: true,
  createdAt: true
} satisfies Prisma.UserProfileSelect