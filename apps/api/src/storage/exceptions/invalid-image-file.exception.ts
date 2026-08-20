import { BadRequestException } from '@nestjs/common'
import { StorageErrorCodes } from '../constants/storage.error-codes'

export class InvalidImageFileException extends BadRequestException {
  constructor() {
    super({ code: StorageErrorCodes.INVALID_IMAGE_FILE, message: 'File must be a JPEG, PNG, WebP, or GIF image' })
  }
}
