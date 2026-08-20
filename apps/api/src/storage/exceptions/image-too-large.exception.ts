import { BadRequestException } from '@nestjs/common'
import { StorageErrorCodes } from '../constants/storage.error-codes'

export class ImageTooLargeException extends BadRequestException {
  constructor(maxSizeMb: number = 5) {
    super({ code: StorageErrorCodes.IMAGE_TOO_LARGE, message: `Image must be smaller than ${maxSizeMb}MB` })
  }
}
