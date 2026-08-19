import { PlatformActionLogPresenter } from 'src/platform/action-log/platform-action-log.presenter'

export const createMockPlatformActionLogPresenter = (): jest.Mocked<Pick<PlatformActionLogPresenter, 'toResponseView'>> => ({
  toResponseView: jest.fn(),
})
