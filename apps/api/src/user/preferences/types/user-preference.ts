import { Prisma } from 'generated/prisma/client'
import { USER_PREFERENCE_SELECT } from '../selects/user-preference.select'

export type UserPreference = Prisma.UserPreferenceGetPayload<{ select: typeof USER_PREFERENCE_SELECT }>
