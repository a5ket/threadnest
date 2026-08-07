import { Prisma } from 'generated/prisma/client'

export const USER_NEST_PREFERENCE_SELECT = {
  userId: true,
  nestId: true,
  allowInvites: true,
  muted: true
} satisfies Prisma.UserNestPreferenceSelect