import { BlockPresenter } from 'src/block/block.presenter'

export const createMockBlockPresenter = (): jest.Mocked<Pick<BlockPresenter, 'toView'>> => ({
  toView: jest.fn(),
})
