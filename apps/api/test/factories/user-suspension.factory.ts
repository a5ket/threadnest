import type { UserSuspension } from 'generated/prisma/client'

export const createUserSuspension = (
  overrides: Partial<UserSuspension> = {},
): UserSuspension => ({
  id: 'suspension-1',
  userId: 'user-1',
  reason: 'Spam',
  suspendedById: 'mod-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  revokedAt: null,
  revokedById: null,
  ...overrides,
})
