import { NestSettingsRepository } from 'src/nest/settings/nest-settings.repository'

export const createMockNestSettingsRepository = (): jest.Mocked<Pick<NestSettingsRepository, 'get' | 'update' | 'create'>> => ({
  get: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
})
