import { UserSuspensionPresenter } from 'src/user/suspension/user-suspension.presenter'

export const createMockUserSuspensionPresenter = (): jest.Mocked<Pick<UserSuspensionPresenter, 'toView' | 'toActiveView'>> => ({
  toView: jest.fn(),
  toActiveView: jest.fn(),
})
