import { Controller, Get, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { ThreadSearchResponseDto } from 'src/thread/dto/thread-search-response.dto'
import { ThreadFeedQueryDto } from 'src/thread/dto/thread-feed.query.dto'
import { ThreadService } from 'src/thread/thread.service'

/** The signed-in user's cross-nest chronological thread feed. */
@ApiTags('Me')
@Controller('/me/feed')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeFeedController {
  constructor(
    private readonly threads: ThreadService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meFeedList', summary: 'List threads from nests the current user is a member of, newest first' })
  @ApiPaginatedResponse({ status: 200, description: 'Feed threads', type: ThreadSearchResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(
    @Query() query: ThreadFeedQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.threads.listFeed(user.id, query)
  }
}
