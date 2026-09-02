import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { CommentService } from './comment.service'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentQueryDto } from './dto/comment.query.dto'
import { CommentResponseDto } from './dto/comment-response.dto'
import { CommentNodeResponseDto, CommentTreeMetaDto } from './dto/comment-node-response.dto'

/** Lists a thread's comment tree and creates top-level comments on it. */
@ApiTags('Comments')
@Controller('nests/:nestSlug/threads/:threadSlug/comments')
@UseInterceptors(ResponseInterceptor)
export class ThreadCommentController {
  constructor(
    private readonly comments: CommentService
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'nestThreadCommentList', summary: 'List comments on a thread' })
  @ApiPaginatedResponse({ status: 200, description: 'Comments', type: CommentNodeResponseDto, metaType: CommentTreeMetaDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, NestNotFoundException, ThreadNotFoundException)
  listByThread(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @OptionalCurrentUser() user: AuthUser | null,
    @Query() query: CommentQueryDto
  ) {
    return this.comments.listCommentsByThreadSlug(nestSlug, threadSlug, user?.id ?? null, query)
  }

  @AuthenticatedAndVerified()
  @Post()
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'nestThreadCommentCreate', summary: 'Comment on a thread' })
  @ApiDataResponse({ status: 201, description: 'Comment created', type: CommentResponseDto })
  @ApiExceptionResponses(ValidationException, NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  createThreadComment(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Body() dto: CommentCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.comments.createThreadCommentByThreadSlug(nestSlug, threadSlug, user.id, dto)
  }
}
