import { Prisma } from 'generated/prisma/client'
import { NestInviteStatus } from 'generated/prisma/enums'
import { NEST_INVITE_SUMMARY_SELECT } from 'src/nest/invite/selects/nest-invite.summary.select'

type NestInviteSummary = Prisma.NestInviteGetPayload<{ select: typeof NEST_INVITE_SUMMARY_SELECT }>

export const createNestInviteSummary = (overrides: Partial<NestInviteSummary> = {}): NestInviteSummary => ({
  id: 'invite-1',
  message: null,
  status: NestInviteStatus.PENDING,
  resolvedAt: null,
  createdAt: new Date('2024-01-01'),
  nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null },
  user: { id: 'user-1', profile: { username: 'user-1', displayName: null, avatarKey: null } },
  invitedBy: { id: 'actor-1', profile: { username: 'actor-1', displayName: null, avatarKey: null } },
  resolvedBy: null,
  ...overrides,
})
