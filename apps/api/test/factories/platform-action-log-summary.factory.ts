import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformActionLogSummary } from 'src/platform/action-log/types/platform-action-log.summary'

export const createPlatformActionLogSummary = (
  overrides: Partial<PlatformActionLogSummary> = {},
): PlatformActionLogSummary => ({
  id: 'action-log-1',
  type: PlatformActionType.USER_SUSPENDED,
  data: { reason: 'spam' },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  actor: { id: 'actor-1', profile: { username: 'actor', displayName: null, avatarUrl: null } },
  target: { id: 'target-1', profile: { username: 'target', displayName: null, avatarUrl: null } },
  nest: null,
  ...overrides,
})
