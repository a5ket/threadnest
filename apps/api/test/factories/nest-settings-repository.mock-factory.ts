import { NestSettingsRepository } from 'src/nest/settings/nest-settings.repository'

export const createMockNestSettingsRepository = (): jest.Mocked<Pick<NestSettingsRepository, 'get'>> => ({
  get: jest.fn(),
})
