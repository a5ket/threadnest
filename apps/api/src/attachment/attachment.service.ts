import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { ImageProcessor } from 'src/storage/image-processor'
import { StorageService } from 'src/storage/storage.service'

const ATTACHMENT_MAX_DIMENSION = 1920

@Injectable()
export class AttachmentService {
  constructor(
    private readonly storage: StorageService,
    private readonly imageProcessor: ImageProcessor
  ) { }

  async upload(userId: string, rawBuffer: Buffer) {
    const { buffer, width, height } = await this.imageProcessor.toBoundedWebp(rawBuffer, ATTACHMENT_MAX_DIMENSION)
    const key = `attachments/${userId}/${randomBytes(8).toString('hex')}.webp`

    await this.storage.upload(key, buffer, 'image/webp')

    return { key, width, height }
  }
}
