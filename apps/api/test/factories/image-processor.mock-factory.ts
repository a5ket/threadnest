import { ImageProcessor } from 'src/storage/image-processor'

export const createMockImageProcessor = (): jest.Mocked<Pick<ImageProcessor, 'toSquareWebp' | 'toBoundedWebp'>> => ({
  toSquareWebp: jest.fn().mockResolvedValue(Buffer.from('processed')),
  toBoundedWebp: jest.fn().mockResolvedValue({ buffer: Buffer.from('processed'), width: 800, height: 600 }),
})
