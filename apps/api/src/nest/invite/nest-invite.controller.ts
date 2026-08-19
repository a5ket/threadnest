import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AlreadyMemberException } from 'src/nest/member/exceptions/already-member.exception'
import { UserIsBannedException } from 'src/nest/member/exceptions/user-is-banned.exception'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { NestInviteCreateDto } from './dto/nest-invite-create.dto'
import { NestInviteResponseDto } from './dto/nest-invite-response.dto'
import { AlreadyHasPendingJoinRequestException } from '../join-request/exceptions/already-has-pending-join-request.exception'
import { AlreadyInvitedException } from './exceptions/already-invited.exception'
import { InviteNotPendingException } from './exceptions/invite-not-pending.exception'
import { InvitesNotAllowedException } from './exceptions/invites-not-allowed.exception'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'
import { NestInviteService } from './nest-invite.service'

@ApiTags('Nest Invites')
@Controller('nests/:nestSlug/invites')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestInviteCollectionController {
  constructor(
    private readonly invites: NestInviteService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestInviteList', summary: 'List invites sent by a nest' })
  @ApiDataResponse({ status: 200, description: 'Invites', type: NestInviteResponseDto, isArray: true })
  @ApiExceptionResponses(InsufficientPermissionsException)
  list(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.listAsNest(nestSlug, user.id)
  }

  @Post()
  @Verified()
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'nestInviteCreate', summary: 'Invite a user to a nest' })
  @ApiDataResponse({ status: 201, description: 'Invite sent', type: NestInviteResponseDto })
  @ApiExceptionResponses(
    ValidationException,
    UserNotFoundException,
    UserIsBannedException,
    AlreadyMemberException,
    AlreadyInvitedException,
    AlreadyHasPendingJoinRequestException,
    InvitesNotAllowedException,
    InsufficientPermissionsException,
  )
  create(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestInviteCreateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.create(nestSlug, user.id, dto.userId)
  }

  @Get(':inviteId')
  @ApiOperation({ operationId: 'nestInviteGet', summary: 'Get an invite sent by a nest' })
  @ApiDataResponse({ status: 200, description: 'Invite', type: NestInviteResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException, NestInviteNotFoundException)
  get(
    @Param('nestSlug') nestSlug: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.getAsNest(nestSlug, inviteId, user.id)
  }

  @Post(':inviteId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestInviteRevoke', summary: 'Revoke a pending invite' })
  @ApiResponse({ status: 204, description: 'Invite revoked' })
  @ApiExceptionResponses(InsufficientPermissionsException, NestInviteNotFoundException, InviteNotPendingException)
  async revoke(
    @Param('nestSlug') nestSlug: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.invites.revoke(nestSlug, inviteId, user.id)
  }
}
