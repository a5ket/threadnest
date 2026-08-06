import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { CommentService } from './comment.service'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentQueryDto } from './dto/comment.query.dto'
import { CommentResponseDto } from './dto/comment-response.dto'
import { CommentNodeResponseDto, CommentTreeMetaDto } from './dto/comment-node-response.dto'
import { CommentNotFoundException } from './exceptions/comment-not-found.exception'

@ApiTags('Comments')
@Controller('comments')
@UseInterceptors(ResponseInterceptor)
export class CommentController {
  constructor(
    private readonly comments: CommentService
  ) { }

  @Get(':commentId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'commentGet', summary: 'Get a comment by ID' })
  @ApiDataResponse({ status: 200, description: 'Comment', type: CommentResponseDto })
  @ApiExceptionResponses(CommentNotFoundException, ThreadNotFoundException)
  async getComment(
    @Param('commentId') commentId: string,
    @OptionalCurrentUser() user: AuthUser | null
  ) {
    return this.comments.getCommentById(commentId, user?.id ?? null)
  }

  @Get(':commentId/replies')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'commentListReplies', summary: 'List replies to a comment' })
  @ApiPaginatedResponse({ status: 200, description: 'Replies', type: CommentNodeResponseDto, metaType: CommentTreeMetaDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, CommentNotFoundException, ThreadNotFoundException)
  async listCommentReplies(
    @Param('commentId') commentId: string,
    @OptionalCurrentUser() user: AuthUser | null,
    @Query() query: CommentQueryDto
  ) {
    return this.comments.listCommentReplies(commentId, user?.id ?? null, query)
  }

  @AuthenticatedAndVerified()
  @Post(':commentId/replies')
  @ApiOperation({ operationId: 'commentCreateReply', summary: 'Reply to a comment' })
  @ApiDataResponse({ status: 201, description: 'Reply created', type: CommentResponseDto })
  @ApiExceptionResponses(ValidationException, CommentNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  async createCommentReply(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CommentCreateDto
  ) {
    return this.comments.createCommentReply(commentId, user.id, dto)
  }

  @AuthenticatedAndVerified()
  @Patch(':commentId')
  @ApiOperation({ operationId: 'commentUpdate', summary: 'Update a comment\'s content' })
  @ApiDataResponse({ status: 200, description: 'Comment updated', type: CommentResponseDto })
  @ApiExceptionResponses(ValidationException, CommentNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CommentUpdateDto
  ) {
    return this.comments.updateComment(commentId, user.id, dto)
  }

  @AuthenticatedAndVerified()
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'commentDelete', summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  @ApiExceptionResponses(CommentNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  async removeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.comments.removeComment(commentId, user.id)
  }
}
