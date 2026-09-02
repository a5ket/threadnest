export type UserProfileFixture = {
  userId: string
  username: string
  displayName: string | null
  bio: string | null
  avatarKey: string | null
  createdAt: Date
}

export const createUserProfile = (
  overrides: Partial<UserProfileFixture> = {},
): UserProfileFixture => ({
  userId: 'user-1',
  username: 'happy_otter1234',
  displayName: null,
  bio: null,
  avatarKey: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
})
