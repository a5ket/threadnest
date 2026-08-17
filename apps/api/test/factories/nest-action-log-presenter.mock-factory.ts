import { NestActionLogPresenter } from 'src/nest/action-log/nest-action-log.presenter'

export const createMockNestActionLogPresenter = (): jest.Mocked<Pick<NestActionLogPresenter, 'toResponseView'>> => ({
  toResponseView: jest.fn(),
})
