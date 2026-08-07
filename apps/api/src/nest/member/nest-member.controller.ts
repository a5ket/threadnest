import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query, UseInterceptors } from '@nestjs/common'
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
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { NestMemberResponseDto } from './dto/nest-member-response.dto'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { NestMemberUpdateRoleDto } from './dto/nest-member.update-role.dto'
import { CannotAssignHigherOrEqualRoleException } from './exceptions/cannot-assign-higher-or-equal-role.exception'
import { CannotChangeYourOwnRoleException } from './exceptions/cannot-change-your-own-role.exception'
import { CannotManageHigherRoleMemberException } from './exceptions/cannot-manage-higher-role-member.exception'
import { CannotRemoveYourselfException } from './exceptions/cannot-remove-yourself.exception'
import { MemberNotFoundException } from './exceptions/member-not-found.exception'
import { MemberRoleUnchangedException } from './exceptions/member-role-unchanged.exception'
import { NestMemberService } from './nest-member.service'

@ApiTags('Nest Members')
@Controller('nests/:nestSlug/members')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestMemberController {
  constructor(private readonly nestMember: NestMemberService) { }

  @Get()
  @ApiOperation({ operationId: 'nestMemberList', summary: 'List members of a nest' })
  @ApiPaginatedResponse({ status: 200, description: 'Members', type: NestMemberResponseDto })
  @ApiExceptionResponses(ValidationException, InvalidCursorException, NestNotFoundException, InsufficientPermissionsException)
  list(
    @Param('nestSlug') nestSlug: string,
    @Query() query: NestMemberQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.nestMember.listMembers(nestSlug, user.id, query)
  }

  @Delete(':userId')
  @Verified()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestMemberRemove', summary: 'Remove a member from a nest' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiExceptionResponses(
    NestNotFoundException,
    CannotRemoveYourselfException,
    InsufficientPermissionsException,
    MemberNotFoundException,
  )
  async remove(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nestMember.removeMember(nestSlug, user.id, targetUserId)
  }

  @Patch(':userId/role')
  @Verified()
  @ApiOperation({ operationId: 'nestMemberChangeRole', summary: 'Change a member\'s role' })
  @ApiDataResponse({ status: 200, description: 'Role changed', type: NestMemberResponseDto })
  @ApiExceptionResponses(
    ValidationException,
    NestNotFoundException,
    CannotChangeYourOwnRoleException,
    InsufficientPermissionsException,
    MemberNotFoundException,
    MemberRoleUnchangedException,
    CannotManageHigherRoleMemberException,
    CannotAssignHigherOrEqualRoleException,
  )
  changeMemberRole(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: NestMemberUpdateRoleDto,
  ) {
    return this.nestMember.changeRole(nestSlug, user.id, targetUserId, dto)
  }
}
