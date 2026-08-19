import { Controller, Get, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { PlatformActionLogResponseDto } from './dto/platform-action-log-response.dto'
import { PlatformActionLogQueryDto } from './dto/platform-action-log.query.dto'
import { PlatformActionLogService } from './platform-action-log.service'

@ApiTags('Platform Action Log')
@Controller('platform/action-logs')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class PlatformActionLogController {
  constructor(
    private readonly actionLogs: PlatformActionLogService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'platformActionLogList', summary: 'List the platform-wide moderation action log' })
  @ApiPaginatedResponse({ status: 200, description: 'Action log entries', type: PlatformActionLogResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, InsufficientPermissionsException)
  list(
    @Query() query: PlatformActionLogQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.actionLogs.list(user.id, query)
  }
}
