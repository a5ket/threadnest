import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { UserActivityItemResponseDto } from './dto/user-activity-item-response.dto'
import { UserActivityQueryDto } from './dto/user-activity.query.dto'
import { UserActivityService } from './user-activity.service'

/** A public profile's activity feed: threads and comments merged into one timeline. */
@ApiTags('Users')
@Controller('users/:username')
@UseInterceptors(ResponseInterceptor)
export class UserActivityController {
  constructor(private readonly activity: UserActivityService) { }

  @Get('activity')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'userActivityList', summary: 'List threads and comments authored by this user, newest first' })
  @ApiPaginatedResponse({ status: 200, description: 'Activity', type: UserActivityItemResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, UserNotFoundException)
  list(
    @Param('username') username: string,
    @Query() query: UserActivityQueryDto,
    @OptionalCurrentUser() user: AuthUser | null
  ) {
    return this.activity.listActivity(username, user?.id, query)
  }
}
