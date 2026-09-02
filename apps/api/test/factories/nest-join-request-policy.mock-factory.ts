import { NestJoinRequestPolicy } from 'src/nest/join-request/nest-join-request.policy'

export const createMockNestJoinRequestPolicy = (): jest.Mocked<Pick<NestJoinRequestPolicy, 'assertCanCreate' | 'assertCanCancel' | 'assertCanListAsNest' | 'assertCanGetAsUser' | 'assertCanGetAsNest' | 'assertCanApprove' | 'assertCanReject'>> => ({
  assertCanCreate: jest.fn(),
  assertCanCancel: jest.fn(),
  assertCanListAsNest: jest.fn(),
  assertCanGetAsUser: jest.fn(),
  assertCanGetAsNest: jest.fn(),
  assertCanApprove: jest.fn(),
  assertCanReject: jest.fn(),
})
