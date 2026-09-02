import { NestSettingsPolicy } from 'src/nest/settings/nest-settings.policy'

export const createMockNestSettingsPolicy = (): jest.Mocked<Pick<NestSettingsPolicy, 'assertCanViewSettings' | 'assertCanUpdateSettings'>> => ({
  assertCanViewSettings: jest.fn(),
  assertCanUpdateSettings: jest.fn(),
})
