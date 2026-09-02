import { Injectable } from '@nestjs/common'
import sharp from 'sharp'
import { ImageTooLargeException } from './exceptions/image-too-large.exception'
import { InvalidImageFileException } from './exceptions/invalid-image-file.exception'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024)

/** Validates and re-encodes uploaded images to webp, via `sharp`. */
@Injectable()
export class ImageProcessor {
  /**
   * Square-crops (centered) and re-encodes as webp — for avatars/icons, where a fixed aspect
   * ratio matters more than preserving the original framing. Also doubles as content validation:
   * `sharp` throws on anything that isn't a decodable image, regardless of the claimed mimetype.
   *
   * @param buffer - The raw uploaded image bytes.
   * @param size - The output's width and height, in pixels (always square).
   * @returns The processed webp image.
   * @throws {ImageTooLargeException} `buffer` exceeds the upload size limit.
   * @throws {InvalidImageFileException} `buffer` isn't a decodable image.
   */
  async toSquareWebp(buffer: Buffer, size: number): Promise<Buffer> {
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new ImageTooLargeException(MAX_UPLOAD_MB)
    }

    try {
      return await sharp(buffer)
        .rotate()
        .resize(size, size, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toBuffer()
    }
    catch {
      throw new InvalidImageFileException()
    }
  }

  /**
   * Resizes only if larger than `maxDimension`, preserving aspect ratio — no crop. For content
   * where the original framing matters, unlike avatars/icons (see {@link toSquareWebp}).
   *
   * @param buffer - The raw uploaded image bytes.
   * @param maxDimension - The maximum width/height; smaller images pass through unresized.
   * @returns The processed webp image and its final dimensions.
   * @throws {ImageTooLargeException} `buffer` exceeds the upload size limit.
   * @throws {InvalidImageFileException} `buffer` isn't a decodable image.
   */
  async toBoundedWebp(buffer: Buffer, maxDimension: number): Promise<{ buffer: Buffer, width: number, height: number }> {
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new ImageTooLargeException(MAX_UPLOAD_MB)
    }

    try {
      const { data, info } = await sharp(buffer)
        .rotate()
        .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true })

      return { buffer: data, width: info.width, height: info.height }
    }
    catch {
      throw new InvalidImageFileException()
    }
  }
}
