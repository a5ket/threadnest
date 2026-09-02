import { BlockedUser } from 'src/block/types/blocked-user'

export const createBlockedUser = (
  overrides: Partial<BlockedUser> = {},
): BlockedUser => ({
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  blocked: { id: 'user-2', profile: { username: 'lucky_fox5678', displayName: null, avatarKey: null } },
  ...overrides,
})
