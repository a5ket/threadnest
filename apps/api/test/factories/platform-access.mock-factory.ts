import { PlatformAccess } from 'src/platform/platform.access'

export const createMockPlatformAccess = (): jest.Mocked<Pick<PlatformAccess, 'getContext'>> => ({
  getContext: jest.fn(),
})
