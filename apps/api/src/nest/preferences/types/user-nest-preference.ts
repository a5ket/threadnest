import { Prisma } from 'generated/prisma/client'
import { USER_NEST_PREFERENCE_SELECT } from '../selects/user-nest-preference.select'

export type UserNestPreference = Prisma.UserNestPreferenceGetPayload<{ select: typeof USER_NEST_PREFERENCE_SELECT }>