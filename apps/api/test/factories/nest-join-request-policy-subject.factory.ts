import { NestJoinRequestStatus } from 'generated/prisma/enums'
import { NestJoinRequestPolicySubject } from 'src/nest/join-request/types/nest-join-request.policy-subject'

export const createNestJoinRequestPolicySubject = (
  overrides: Partial<NestJoinRequestPolicySubject> = {},
): NestJoinRequestPolicySubject => ({
  nestId: 'nest-1',
  userId: 'user-1',
  status: NestJoinRequestStatus.PENDING,
  ...overrides,
})
