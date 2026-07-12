import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { VerifiedGuard } from 'src/security/guards/verified.guard'
import { CommentService } from './comment.service'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentQueryDto } from './dto/comment.query.dto'

@Controller('comments')
@UseInterceptors(ResponseInterceptor)
export class CommentController {
  constructor(
    private readonly comments: CommentService
  ) { }

  @Get(':commentId')
  @UseGuards(OptionalAuthGuard)
  async getComment(
    @Param('commentId') commentId: string,
    @OptionalCurrentUser() user: AuthUser | null
  ) {
    return this.comments.getCommentById(commentId, user?.id ?? null)
  }

  @Get(':commentId/replies')
  @UseGuards(OptionalAuthGuard)
  async listCommentReplies(
    @Param('commentId') commentId: string,
    @OptionalCurrentUser() user: AuthUser | null,
    @Query() query: CommentQueryDto
  ) {
    return this.comments.listCommentReplies(commentId, user?.id ?? null, query)
  }

  @UseGuards(AuthGuard, VerifiedGuard)
  @Post(':commentId/replies')
  async createCommentReply(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CommentCreateDto
  ) {
    return this.comments.createCommentReply(commentId, user.id, dto)
  }

  @UseGuards(AuthGuard, VerifiedGuard)
  @Patch(':commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CommentUpdateDto
  ) {
    return this.comments.updateComment(commentId, user.id, dto)
  }

  @UseGuards(AuthGuard, VerifiedGuard)
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.comments.removeComment(commentId, user.id)
  }
}