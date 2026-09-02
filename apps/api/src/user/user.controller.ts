import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { InvalidCursorException } from 'src/common/exceptions/invalid-cursor.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ApiPaginatedResponse } from 'src/common/swagger/api-paginated-response.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { OptionalCurrentUser } from 'src/security/decorators/optional-current-user.decorator'
import { OptionalAuthGuard } from 'src/security/guards/optional-auth.guard'
import { UserProfileResponseDto } from './dto/user-profile-response.dto'
import { UserQueryDto } from './dto/user.query.dto'
import { UserSummaryResponseDto } from './dto/user-summary-response.dto'
import { UserNotFoundException } from './exceptions/user-not-found.exception'
import { UserService } from './user.service'

/**
 * Public, read-only user lookups (search, profile by username). Account-management endpoints
 * for the signed-in user live under `/me` — see {@link MeProfileController}.
 */
@ApiTags('Users')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly user: UserService) { }

  @Get()
  @ApiOperation({ operationId: 'userList', summary: 'Search users by username or display name' })
  @ApiPaginatedResponse({ status: 200, description: 'Users', type: UserSummaryResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException)
  list(@Query() query: UserQueryDto) {
    return this.user.search(query)
  }

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ operationId: 'userGetByUsername', summary: 'Get a user\'s profile by username' })
  @ApiDataResponse({ status: 200, description: 'User profile', type: UserProfileResponseDto })
  @ApiExceptionResponses(UserNotFoundException)
  getByUsername(
    @Param('username') username: string,
    @OptionalCurrentUser() user: AuthUser | null
  ) {
    return this.user.getProfileByUsername(username, user?.id)
  }
}
