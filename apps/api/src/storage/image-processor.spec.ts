import sharp from 'sharp'
import { ImageTooLargeException } from './exceptions/image-too-large.exception'
import { InvalidImageFileException } from './exceptions/invalid-image-file.exception'
import { ImageProcessor } from './image-processor'

jest.mock('sharp', () => jest.fn())

describe('ImageProcessor', () => {
  const processor = new ImageProcessor()
  const mockSharp = sharp as unknown as jest.Mock

  const createPipeline = (toBuffer: jest.Mock) => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('toSquareWebp', () => {
    it('rejects a buffer larger than the upload limit without invoking sharp', async () => {
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1)

      await expect(processor.toSquareWebp(oversized, 256)).rejects.toThrow(ImageTooLargeException)

      expect(mockSharp).not.toHaveBeenCalled()
    })

    it('rotates, center-crops to a square, and re-encodes as webp', async () => {
      const output = Buffer.from('webp-bytes')
      const pipeline = createPipeline(jest.fn().mockResolvedValue(output))
      mockSharp.mockReturnValue(pipeline)

      const result = await processor.toSquareWebp(Buffer.from('raw'), 256)

      expect(pipeline.resize).toHaveBeenCalledWith(256, 256, { fit: 'cover', position: 'centre' })
      expect(pipeline.webp).toHaveBeenCalledWith({ quality: 82 })
      expect(result).toBe(output)
    })

    it('wraps a decode failure as InvalidImageFileException', async () => {
      const pipeline = createPipeline(jest.fn().mockRejectedValue(new Error('not an image')))
      mockSharp.mockReturnValue(pipeline)

      await expect(processor.toSquareWebp(Buffer.from('not-an-image'), 256)).rejects.toThrow(InvalidImageFileException)
    })
  })

  describe('toBoundedWebp', () => {
    it('rejects a buffer larger than the upload limit without invoking sharp', async () => {
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1)

      await expect(processor.toBoundedWebp(oversized, 1200)).rejects.toThrow(ImageTooLargeException)

      expect(mockSharp).not.toHaveBeenCalled()
    })

    it('resizes only if larger than maxDimension, preserving aspect ratio, and returns the resulting dimensions', async () => {
      const output = Buffer.from('webp-bytes')
      const pipeline = createPipeline(jest.fn().mockResolvedValue({ data: output, info: { width: 800, height: 600 } }))
      mockSharp.mockReturnValue(pipeline)

      const result = await processor.toBoundedWebp(Buffer.from('raw'), 1200)

      expect(pipeline.resize).toHaveBeenCalledWith(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      expect(result).toEqual({ buffer: output, width: 800, height: 600 })
    })

    it('wraps a decode failure as InvalidImageFileException', async () => {
      const pipeline = createPipeline(jest.fn().mockRejectedValue(new Error('not an image')))
      mockSharp.mockReturnValue(pipeline)

      await expect(processor.toBoundedWebp(Buffer.from('not-an-image'), 1200)).rejects.toThrow(InvalidImageFileException)
    })
  })
})
