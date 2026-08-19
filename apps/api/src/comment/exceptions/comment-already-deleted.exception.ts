import { ConflictException } from '@nestjs/common'
import { CommentErrorCodes } from '../constants/comment.error-codes'

export class CommentAlreadyDeletedException extends ConflictException {
  constructor() {
    super({ code: CommentErrorCodes.COMMENT_ALREADY_DELETED, message: 'This comment has already been deleted' })
  }
}
