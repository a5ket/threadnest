import type { PlatformRoleGrant } from 'generated/prisma/client'
import { PlatformRole } from 'generated/prisma/enums'

export const createPlatformRoleGrant = (
  overrides: Partial<PlatformRoleGrant> = {},
): PlatformRoleGrant => ({
  id: 'grant-1',
  userId: 'user-1',
  role: PlatformRole.MODERATOR,
  grantedById: 'admin-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  revokedAt: null,
  revokedById: null,
  ...overrides,
})
