import { NestBanPolicy } from 'src/nest/ban/nest-ban.policy'

export const createMockNestBanPolicy = (): jest.Mocked<Pick<NestBanPolicy, 'assertCanBanUser' | 'assertCanUnbanUser' | 'assertCanViewBans'>> => ({
  assertCanBanUser: jest.fn(),
  assertCanUnbanUser: jest.fn(),
  assertCanViewBans: jest.fn(),
})
