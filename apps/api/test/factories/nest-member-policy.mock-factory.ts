import { NestMemberPolicy } from 'src/nest/member/nest-member.policy'

export const createMockNestMemberPolicy = (): jest.Mocked<Pick<NestMemberPolicy, 'assertCanJoinNest' | 'assertCanLeaveNest' | 'assertCanListMembers' | 'assertCanRemoveMember' | 'assertCanChangeRole'>> => ({
  assertCanJoinNest: jest.fn(),
  assertCanLeaveNest: jest.fn(),
  assertCanListMembers: jest.fn(),
  assertCanRemoveMember: jest.fn(),
  assertCanChangeRole: jest.fn(),
})
