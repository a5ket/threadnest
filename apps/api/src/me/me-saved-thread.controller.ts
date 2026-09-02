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
import { ThreadSavedQueryDto } from 'src/thread/dto/thread-saved.query.dto'
import { ThreadService } from 'src/thread/thread.service'

/** The signed-in user's saved threads. */
@ApiTags('Me')
@Controller('/me/saved-threads')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeSavedThreadController {
  constructor(
    private readonly threads: ThreadService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meSavedThreadList', summary: 'List threads saved by the current user' })
  @ApiPaginatedResponse({ status: 200, description: 'Saved threads', type: ThreadSearchResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(
    @Query() query: ThreadSavedQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.threads.listSavedThreads(user.id, query)
  }
}
