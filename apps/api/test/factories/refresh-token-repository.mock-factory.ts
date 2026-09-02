import { RefreshTokenRepository } from 'src/auth/refresh-token.repository'

export const createMockRefreshTokenRepository = (): jest.Mocked<Pick<RefreshTokenRepository, 'create' | 'findByHash' | 'revokeOne' | 'revokeAll' | 'rotate'>> => ({
  create: jest.fn(),
  findByHash: jest.fn(),
  revokeOne: jest.fn(),
  revokeAll: jest.fn(),
  rotate: jest.fn(),
})
