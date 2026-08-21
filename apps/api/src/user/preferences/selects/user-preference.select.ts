import { Prisma } from 'generated/prisma/client'

export const USER_PREFERENCE_SELECT = {
  userId: true,
  showActivityOnProfile: true
} satisfies Prisma.UserPreferenceSelect
