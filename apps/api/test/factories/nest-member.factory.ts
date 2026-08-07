import { NestMemberRole } from 'generated/prisma/enums'

export type NestMemberRecord = {
  nestId: string
  userId: string
  role: NestMemberRole
  createdAt: Date
  user: {
    id: string
    profile: { username: string, displayName: string | null, avatarUrl: string | null } | null
  }
}

export const createNestMember = (
  overrides: Partial<NestMemberRecord> = {},
): NestMemberRecord => ({
  nestId: 'nest-1',
  userId: 'user-1',
  role: NestMemberRole.MEMBER,
  createdAt: new Date('2024-01-01'),
  user: { id: 'user-1', profile: { username: 'user-1', displayName: null, avatarUrl: null } },
  ...overrides,
})
