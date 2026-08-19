import { PlatformRoleGrantPresenter } from 'src/platform/role-grant/platform-role-grant.presenter'

export const createMockPlatformRoleGrantPresenter = (): jest.Mocked<Pick<PlatformRoleGrantPresenter, 'toView' | 'toActiveRoleView'>> => ({
  toView: jest.fn(),
  toActiveRoleView: jest.fn(),
})
