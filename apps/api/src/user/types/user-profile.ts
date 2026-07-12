import { Prisma } from 'generated/prisma/client'
import { USER_PROFILE_SELECT } from '../constants/user-profile.select'

export type UserProfile = Prisma.UserProfileGetPayload<{ select: typeof USER_PROFILE_SELECT }>
