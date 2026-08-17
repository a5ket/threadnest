import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { NestActionLogResponseDto } from './dto/nest-action-log-response.dto'
import { NestActionLogQueryDto } from './dto/nest-action-log.query.dto'
import { NestActionLogService } from './nest-action-log.service'

@ApiTags('Nest Action Log')
@Controller('nests/:nestSlug/action-logs')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestActionLogController {
  constructor(
    private readonly actionLogs: NestActionLogService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestActionLogList', summary: 'List the moderation action log for a nest' })
  @ApiPaginatedResponse({ status: 200, description: 'Action log entries', type: NestActionLogResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, NestNotFoundException, InsufficientPermissionsException)
  list(
    @Param('nestSlug') nestSlug: string,
    @Query() query: NestActionLogQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.actionLogs.listByNest(nestSlug, user.id, query)
  }
}
