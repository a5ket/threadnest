import { BadRequestException } from '@nestjs/common'
import { AttachmentErrorCodes } from '../constants/attachment.error-codes'

export class InvalidAttachmentKeyException extends BadRequestException {
  constructor() {
    super({ code: AttachmentErrorCodes.INVALID_ATTACHMENT_KEY, message: 'One or more attachments were not uploaded by you' })
  }
}
