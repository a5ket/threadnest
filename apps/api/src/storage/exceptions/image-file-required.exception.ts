import { BadRequestException } from '@nestjs/common'
import { StorageErrorCodes } from '../constants/storage.error-codes'

export class ImageFileRequiredException extends BadRequestException {
  constructor() {
    super({ code: StorageErrorCodes.IMAGE_FILE_REQUIRED, message: 'An image file is required' })
  }
}
