import { NestInvitePolicy } from 'src/nest/invite/nest-invite.policy'

export const createMockNestInvitePolicy = (): jest.Mocked<Pick<NestInvitePolicy, 'assertCanCreate' | 'assertCanListAsNest' | 'assertCanGetAsNest' | 'assertCanGetAsUser' | 'assertCanAccept' | 'assertCanDecline' | 'assertCanRevoke'>> => ({
  assertCanCreate: jest.fn(),
  assertCanListAsNest: jest.fn(),
  assertCanGetAsNest: jest.fn(),
  assertCanGetAsUser: jest.fn(),
  assertCanAccept: jest.fn(),
  assertCanDecline: jest.fn(),
  assertCanRevoke: jest.fn(),
})
