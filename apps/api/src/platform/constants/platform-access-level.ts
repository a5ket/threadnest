import { PlatformRole } from 'generated/prisma/enums'

export const NON_PLATFORM_MEMBER_LEVEL = 0

export const PLATFORM_ACCESS_LEVEL: Record<PlatformRole, number> = {
  MODERATOR: 10,
  ADMIN: 20
}
