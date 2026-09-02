import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CommentNotFoundException } from 'src/comment/exceptions/comment-not-found.exception'
import { CommentAlreadyDeletedException } from 'src/comment/exceptions/comment-already-deleted.exception'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { ThreadAlreadyDeletedException } from 'src/thread/exceptions/thread-already-deleted.exception'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { PlatformContentBulkRemovalResponseDto } from './dto/platform-content-bulk-removal-response.dto'
import { PlatformContentService } from './platform-content.service'

/** Platform-moderator content removal: single threads/comments, or bulk-purge by author. */
@ApiTags('Platform Content')
@Controller('platform/content')
@AuthenticatedAndVerified()
@UseInterceptors(ResponseInterceptor)
export class PlatformContentController {
  constructor(
    private readonly content: PlatformContentService
  ) { }

  @Delete('threads/:threadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'platformContentRemoveThread', summary: 'Remove a thread under platform authority' })
  @ApiResponse({ status: 204, description: 'Thread removed' })
  @ApiExceptionResponses(InsufficientPermissionsException, ThreadNotFoundException, ThreadAlreadyDeletedException)
  async removeThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.content.removeThread(threadId, user.id)
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'platformContentRemoveComment', summary: 'Remove a comment under platform authority' })
  @ApiResponse({ status: 204, description: 'Comment removed' })
  @ApiExceptionResponses(InsufficientPermissionsException, CommentNotFoundException, CommentAlreadyDeletedException)
  async removeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.content.removeComment(commentId, user.id)
  }

  @Post('users/:userId/remove-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'platformContentRemoveAllByUser', summary: 'Remove all of a user\'s threads and comments under platform authority' })
  @ApiDataResponse({ status: 200, description: 'Content removed', type: PlatformContentBulkRemovalResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException)
  removeAllContentByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.content.removeAllContentByUser(userId, user.id)
  }
}
