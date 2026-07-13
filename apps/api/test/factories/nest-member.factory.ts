import { NestMemberRole } from 'generated/prisma/enums'

export type NestMemberRecord = {
  nestId: string
  userId: string
  role: NestMemberRole
  createdAt: Date
}

export const createNestMember = (
  overrides: Partial<NestMemberRecord> = {},
): NestMemberRecord => ({
  nestId: 'nest-1',
  userId: 'user-1',
  role: NestMemberRole.MEMBER,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})
