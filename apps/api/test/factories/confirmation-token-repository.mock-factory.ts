import { ConfirmationTokenRepository } from 'src/auth/confirmation-token.repository'

export const createMockConfirmationTokenRepository = (): jest.Mocked<Pick<ConfirmationTokenRepository, 'create' | 'findByHash' | 'redeem' | 'supersedePendingForUser'>> => ({
  create: jest.fn(),
  findByHash: jest.fn(),
  redeem: jest.fn(),
  supersedePendingForUser: jest.fn(),
})
