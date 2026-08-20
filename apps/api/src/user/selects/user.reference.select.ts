import { Prisma } from 'generated/prisma/client'

export const USER_REFERENCE_SELECT = {
  id: true,
  profile: {
    select: {
      username: true,
      displayName: true,
      avatarKey: true,
    },
  },
} satisfies Prisma.UserSelect