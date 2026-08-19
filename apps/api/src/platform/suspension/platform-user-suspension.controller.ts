import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { UserSuspensionActiveResponseDto } from 'src/user/suspension/dto/user-suspension-active-response.dto'
import { UserSuspensionCreateDto } from 'src/user/suspension/dto/user-suspension-create.dto'
import { UserSuspensionResponseDto } from 'src/user/suspension/dto/user-suspension-response.dto'
import { CannotSuspendYourselfException } from 'src/user/suspension/exceptions/cannot-suspend-yourself.exception'
import { UserAlreadySuspendedException } from 'src/user/suspension/exceptions/user-already-suspended.exception'
import { UserSuspensionNotFoundException } from 'src/user/suspension/exceptions/user-suspension-not-found.exception'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { PlatformUserSuspensionService } from './platform-user-suspension.service'

@ApiTags('Platform Suspensions')
@Controller('platform/suspensions')
@AuthenticatedAndVerified()
@UseInterceptors(ResponseInterceptor)
export class PlatformUserSuspensionController {
  constructor(
    private readonly suspensions: PlatformUserSuspensionService
  ) { }

  @Get(':userId')
  @ApiOperation({ operationId: 'userSuspensionGetActive', summary: 'Check whether a user is currently suspended' })
  @ApiDataResponse({ status: 200, description: 'Active suspension status', type: UserSuspensionActiveResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException)
  getActive(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.suspensions.getActive(userId, user.id)
  }

  @Post(':userId')
  @ApiOperation({ operationId: 'userSuspensionCreate', summary: 'Suspend a user\'s account' })
  @ApiDataResponse({ status: 201, description: 'User suspended', type: UserSuspensionResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException, UserNotFoundException, CannotSuspendYourselfException, UserAlreadySuspendedException)
  suspend(
    @Param('userId') userId: string,
    @Body() dto: UserSuspensionCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.suspensions.suspend(userId, user.id, dto)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'userSuspensionRevoke', summary: 'Lift a user\'s suspension' })
  @ApiResponse({ status: 204, description: 'Suspension lifted' })
  @ApiExceptionResponses(InsufficientPermissionsException, UserSuspensionNotFoundException)
  async unsuspend(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.suspensions.unsuspend(userId, user.id)
  }
}
