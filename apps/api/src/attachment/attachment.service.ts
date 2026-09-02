import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { ImageProcessor } from 'src/storage/image-processor'
import { StorageService } from 'src/storage/storage.service'

const ATTACHMENT_MAX_DIMENSION = 1920

/** Standalone image uploads for thread/comment attachments — not tied to a specific thread/comment yet. */
@Injectable()
export class AttachmentService {
  constructor(
    private readonly storage: StorageService,
    private readonly imageProcessor: ImageProcessor
  ) { }

  /**
   * Processes and stores an image under the uploader's own key namespace, ahead of it being
   * attached to a thread or comment. The returned key is only usable as an attachment key by its
   * own uploader — see {@link isAttachmentKeyOwnedBy}.
   *
   * @param userId - The uploader; the storage key is namespaced under this id.
   * @param rawBuffer - The raw uploaded image bytes.
   * @returns The storage key plus the processed image's final dimensions.
   * @throws {ImageTooLargeException} `rawBuffer` exceeds the upload size limit.
   * @throws {InvalidImageFileException} `rawBuffer` isn't a decodable image.
   */
  async upload(userId: string, rawBuffer: Buffer) {
    const { buffer, width, height } = await this.imageProcessor.toBoundedWebp(rawBuffer, ATTACHMENT_MAX_DIMENSION)
    const key = `attachments/${userId}/${randomBytes(8).toString('hex')}.webp`

    await this.storage.upload(key, buffer, 'image/webp')

    return { key, width, height }
  }
}
