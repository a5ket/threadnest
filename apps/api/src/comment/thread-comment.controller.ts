import { Body, Controller, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { CommentService } from './comment.service'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentQueryDto } from './dto/comment.query.dto'

@Controller('nests/:nestSlug/threads/:threadSlug/comments')
@UseInterceptors(ResponseInterceptor)
export class ThreadCommentController {
  constructor(
    private readonly comments: CommentService
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
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
  createThreadComment(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Body() dto: CommentCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.comments.createThreadCommentByThreadSlug(nestSlug, threadSlug, user.id, dto)
  }
}