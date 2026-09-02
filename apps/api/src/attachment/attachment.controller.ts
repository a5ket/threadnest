import { Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { ImageFileRequiredException } from 'src/storage/exceptions/image-file-required.exception'
import { ImageTooLargeException } from 'src/storage/exceptions/image-too-large.exception'
import { InvalidImageFileException } from 'src/storage/exceptions/invalid-image-file.exception'
import type { AuthUser } from 'src/common/types/auth.user'
import { AttachmentService } from './attachment.service'
import { AttachmentUploadResponseDto } from './dto/attachment-upload-response.dto'

/** Image upload for thread/comment attachments, ahead of being attached to anything. */
@ApiTags('Attachments')
@Controller('me/attachments')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class AttachmentController {
  constructor(private readonly attachments: AttachmentService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({
    operationId: 'attachmentUpload',
    summary: 'Upload an image to attach to a thread or comment',
    description: 'Uploads and processes the image but doesn\'t attach it to anything yet — pass the returned key when creating/updating the thread or comment.'
  })
  @ApiDataResponse({ status: 200, description: 'Uploaded', type: AttachmentUploadResponseDto })
  @ApiExceptionResponses(ImageFileRequiredException, InvalidImageFileException, ImageTooLargeException)
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new ImageFileRequiredException()
    }

    return this.attachments.upload(user.id, file.buffer)
  }
}
