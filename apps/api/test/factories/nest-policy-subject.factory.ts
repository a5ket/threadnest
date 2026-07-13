import { NestPolicySubject } from 'src/nest/types/nest.policy-subject'

export const createNestPolicySubject = (
  overrides: Partial<NestPolicySubject> = {},
): NestPolicySubject => ({
  id: 'nest-1',
  ...overrides,
})