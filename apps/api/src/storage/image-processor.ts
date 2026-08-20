import { Injectable } from '@nestjs/common'
import sharp from 'sharp'
import { ImageTooLargeException } from './exceptions/image-too-large.exception'
import { InvalidImageFileException } from './exceptions/invalid-image-file.exception'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024)

@Injectable()
export class ImageProcessor {
  // Square-crops and re-encodes as webp — also doubles as content validation, since sharp
  // throws on anything that isn't a decodable image regardless of the claimed mimetype.
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

  // Resizes only if larger than maxDimension, preserving aspect ratio — no crop. For content
  // (thread/comment attachments) where the original framing matters, unlike avatars/icons.
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
