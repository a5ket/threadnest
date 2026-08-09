import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
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
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadDetailResponseDto } from './dto/thread.detail-response.dto'
import { ThreadQueryDto } from './dto/thread.query.dto'
import { ThreadSummaryResponseDto } from './dto/thread.summary-response.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
import { ThreadVoteDto } from './dto/thread.vote.dto'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadService } from './thread.service'

@ApiTags('Threads')
@Controller('nests/:nestSlug/threads')
@UseInterceptors(ResponseInterceptor)
export class NestThreadController {
  constructor(
    private readonly threads: ThreadService,
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'nestThreadList', summary: 'List threads in a nest' })
  @ApiPaginatedResponse({ status: 200, description: 'Threads', type: ThreadSummaryResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, NestNotFoundException, InsufficientPermissionsException)
  listByNest(
    @Param('nestSlug') nestSlug: string,
    @Query() query: ThreadQueryDto,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.listByNest(nestSlug, query, user?.id)
  }

  @Post()
  @ApiOperation({ operationId: 'nestThreadCreate', summary: 'Create a thread in a nest' })
  @ApiDataResponse({ status: 201, description: 'Thread created', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, InsufficientPermissionsException)
  create(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ThreadCreateDto,
  ) {
    return this.threads.createThread(nestSlug, user.id, dto)
  }

  @Get(':threadSlug')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'nestThreadGetBySlug', summary: 'Get a thread by slug' })
  @ApiDataResponse({ status: 200, description: 'Thread', type: ThreadDetailResponseDto })
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException)
  getBySlug(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.getThread(nestSlug, threadSlug, user?.id)
  }

  @Patch(':threadSlug')
  @ApiOperation({ operationId: 'nestThreadUpdate', summary: 'Update a thread\'s title and/or content' })
  @ApiDataResponse({ status: 200, description: 'Thread updated', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  update(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ThreadUpdateDto,
  ) {
    return this.threads.updateThread(nestSlug, threadSlug, user.id, dto)
  }

  @Delete(':threadSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestThreadDelete', summary: 'Delete a thread' })
  @ApiResponse({ status: 204, description: 'Thread deleted' })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  async remove(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.threads.deleteThread(nestSlug, threadSlug, user.id)
  }

  @Post(':threadSlug/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'nestThreadLock', summary: 'Lock a thread' })
  @ApiDataResponse({ status: 200, description: 'Thread locked', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  lock(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.lockThread(nestSlug, threadSlug, user.id)
  }

  @Delete(':threadSlug/lock')
  @ApiOperation({ operationId: 'nestThreadUnlock', summary: 'Unlock a thread' })
  @ApiDataResponse({ status: 200, description: 'Thread unlocked', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  unlock(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.unlockThread(nestSlug, threadSlug, user.id)
  }

  @Post(':threadSlug/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'nestThreadPin', summary: 'Pin a thread' })
  @ApiDataResponse({ status: 200, description: 'Thread pinned', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  pin(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.pinThread(nestSlug, threadSlug, user.id)
  }

  @Delete(':threadSlug/pin')
  @ApiOperation({ operationId: 'nestThreadUnpin', summary: 'Unpin a thread' })
  @ApiDataResponse({ status: 200, description: 'Thread unpinned', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  unpin(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.unpinThread(nestSlug, threadSlug, user.id)
  }

  @Patch(':threadSlug/vote')
  @ApiOperation({ operationId: 'nestThreadVote', summary: 'Cast or change a vote on a thread' })
  @ApiDataResponse({ status: 200, description: 'Thread voted', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  vote(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ThreadVoteDto,
  ) {
    return this.threads.voteOnThread(nestSlug, threadSlug, user.id, dto.type)
  }

  @Delete(':threadSlug/vote')
  @ApiOperation({ operationId: 'nestThreadRemoveVote', summary: 'Remove the current user\'s vote on a thread' })
  @ApiDataResponse({ status: 200, description: 'Vote removed', type: ThreadDetailResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, ThreadNotFoundException, InsufficientPermissionsException)
  removeVote(
    @Param('nestSlug') nestSlug: string,
    @Param('threadSlug') threadSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.threads.removeThreadVote(nestSlug, threadSlug, user.id)
  }
}
