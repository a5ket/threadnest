import { NotFoundException } from '@nestjs/common'
import { CommentErrorCodes } from '../constants/comment.error-codes'

export class CommentNotFoundException extends NotFoundException {
  constructor() {
    super({ code: CommentErrorCodes.COMMENT_NOT_FOUND, message: 'Comment not found' })
  }
}
