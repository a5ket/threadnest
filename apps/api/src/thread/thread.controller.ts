import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { ThreadFeedQueryDto } from './dto/thread-feed.query.dto'
import { ThreadSearchResponseDto } from './dto/thread-search-response.dto'
import { ThreadSearchQueryDto } from './dto/thread-search.query.dto'
import { ThreadService } from './thread.service'

@ApiTags('Threads')
@Controller('threads')
@UseInterceptors(ResponseInterceptor)
export class ThreadController {
  constructor(
    private readonly threads: ThreadService,
  ) { }

  @Get('search')
  @UseGuards(OptionalAuthGuard)
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'threadSearch', summary: 'Search threads by title/content across nests visible to the current user' })
  @ApiPaginatedResponse({ status: 200, description: 'Matching threads', type: ThreadSearchResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  search(
    @Query() query: ThreadSearchQueryDto,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.searchThreads(query, user?.id)
  }

  @Get('discover')
  @UseGuards(OptionalAuthGuard)
  @RateLimit({ limit: 30, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'threadDiscover', summary: 'Recent threads from public nests, for viewers with no personalized feed yet' })
  @ApiPaginatedResponse({ status: 200, description: 'Recent threads', type: ThreadSearchResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  discover(
    @Query() query: ThreadFeedQueryDto,
    @OptionalCurrentUser() user: AuthUser | null,
  ) {
    return this.threads.discoverFeed(query, user?.id)
  }
}
