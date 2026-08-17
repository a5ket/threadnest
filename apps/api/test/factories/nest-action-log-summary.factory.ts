import { NestActionType } from 'generated/prisma/enums'
import { NestActionLogSummary } from 'src/nest/action-log/types/nest-action-log.summary'

export const createNestActionLogSummary = (
  overrides: Partial<NestActionLogSummary> = {},
): NestActionLogSummary => ({
  id: 'action-log-1',
  type: NestActionType.MEMBER_BANNED,
  data: { reason: 'spam' },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  actor: { id: 'actor-1', profile: { username: 'actor', displayName: null, avatarUrl: null } },
  target: { id: 'target-1', profile: { username: 'target', displayName: null, avatarUrl: null } },
  ...overrides,
})
