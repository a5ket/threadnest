import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AlreadyMemberException } from 'src/nest/member/exceptions/already-member.exception'
import { UserIsBannedException } from 'src/nest/member/exceptions/user-is-banned.exception'
import { InviteNotPendingException } from 'src/nest/invite/exceptions/invite-not-pending.exception'
import { NestInviteNotFoundException } from 'src/nest/invite/exceptions/nest-invite-not-found.exception'
import { NestInvitePersonalResponseDto } from 'src/nest/invite/dto/nest-invite-personal-response.dto'
import { NestInviteService } from 'src/nest/invite/nest-invite.service'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'

/** The invited user's side of invites: list mine, view one, accept, decline. */
@ApiTags('Nest Invites')
@Controller('/me/nest-invites')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeNestInviteController {
  constructor(
    private readonly invites: NestInviteService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meNestInviteList', summary: 'List invites sent to the current user' })
  @ApiDataResponse({ status: 200, description: 'Invites', type: NestInvitePersonalResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.listAsUser(user.id)
  }

  @Get(':inviteId')
  @ApiOperation({ operationId: 'meNestInviteGet', summary: 'Get an invite sent to the current user' })
  @ApiDataResponse({ status: 200, description: 'Invite', type: NestInvitePersonalResponseDto })
  @ApiExceptionResponses(NestInviteNotFoundException)
  get(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.getAsUser(inviteId, user.id)
  }

  @Post(':inviteId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNestInviteAccept', summary: 'Accept an invite' })
  @ApiResponse({ status: 204, description: 'Invite accepted' })
  @ApiExceptionResponses(NestInviteNotFoundException, InviteNotPendingException, AlreadyMemberException, UserIsBannedException)
  accept(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.accept(inviteId, user.id)
  }

  @Post(':inviteId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNestInviteDecline', summary: 'Decline an invite' })
  @ApiResponse({ status: 204, description: 'Invite declined' })
  @ApiExceptionResponses(NestInviteNotFoundException, InviteNotPendingException)
  decline(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.decline(inviteId, user.id)
  }
}
