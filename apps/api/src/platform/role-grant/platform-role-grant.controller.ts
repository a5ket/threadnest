import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { PlatformRoleGrantCreateDto } from './dto/platform-role-grant-create.dto'
import { PlatformRoleActiveResponseDto } from './dto/platform-role-active-response.dto'
import { PlatformRoleGrantResponseDto } from './dto/platform-role-grant-response.dto'
import { PlatformRoleGrantNotFoundException } from './exceptions/platform-role-grant-not-found.exception'
import { UserAlreadyHasActiveRoleException } from './exceptions/user-already-has-active-role.exception'
import { PlatformRoleGrantService } from './platform-role-grant.service'

/** Platform-admin management of platform roles (moderator/admin): view, grant, change, revoke. */
@ApiTags('Platform Roles')
@Controller('platform/roles')
@AuthenticatedAndVerified()
@UseInterceptors(ResponseInterceptor)
export class PlatformRoleGrantController {
  constructor(
    private readonly roleGrants: PlatformRoleGrantService
  ) { }

  @Get(':userId')
  @ApiOperation({ operationId: 'platformRoleGrantGetActive', summary: 'Get a user\'s active platform role' })
  @ApiDataResponse({ status: 200, description: 'Active platform role', type: PlatformRoleActiveResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException)
  getActiveRole(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleGrants.getActiveRole(userId, user.id)
  }

  @Post(':userId')
  @ApiOperation({ operationId: 'platformRoleGrantCreate', summary: 'Grant a platform role to a user' })
  @ApiDataResponse({ status: 201, description: 'Role granted', type: PlatformRoleGrantResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException, UserNotFoundException, UserAlreadyHasActiveRoleException)
  grantRole(
    @Param('userId') userId: string,
    @Body() dto: PlatformRoleGrantCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleGrants.grantRole(userId, user.id, dto)
  }

  @Patch(':userId')
  @ApiOperation({ operationId: 'platformRoleGrantChange', summary: 'Change a user\'s active platform role' })
  @ApiDataResponse({ status: 200, description: 'Role changed', type: PlatformRoleGrantResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException, UserNotFoundException, PlatformRoleGrantNotFoundException)
  changeRole(
    @Param('userId') userId: string,
    @Body() dto: PlatformRoleGrantCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleGrants.changeRole(userId, user.id, dto)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'platformRoleGrantRevoke', summary: 'Revoke a user\'s active platform role' })
  @ApiResponse({ status: 204, description: 'Role revoked' })
  @ApiExceptionResponses(InsufficientPermissionsException, PlatformRoleGrantNotFoundException)
  async revokeRole(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.roleGrants.revokeRole(userId, user.id)
  }
}
