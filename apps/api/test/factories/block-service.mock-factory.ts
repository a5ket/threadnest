import { BlockService } from 'src/block/block.service'

export const createMockBlockService = (): jest.Mocked<Pick<BlockService, 'exists'>> => ({
  exists: jest.fn(),
})
