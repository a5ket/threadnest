import { NestInviteStatus } from 'generated/prisma/enums'
import { NestInvitePolicySubject } from 'src/nest/invite/types/nest-invite.policy-subject'

export const createNestInvitePolicySubject = (
  overrides: Partial<NestInvitePolicySubject> = {},
): NestInvitePolicySubject => ({
  nestId: 'nest-1',
  userId: 'user-1',
  status: NestInviteStatus.PENDING,
  ...overrides,
})
