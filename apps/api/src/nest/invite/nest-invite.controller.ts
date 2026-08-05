import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { NestInviteService } from './nest-invite.service'

@Controller('nests/:nestSlug/invites')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestInviteCollectionController {
  constructor(
    private readonly invites: NestInviteService
  ) { }

  @Get()
  list(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.listAsNest(nestSlug, user.id)
  }

  @Post()
  @Verified()
  create(
    @Param('nestSlug') nestSlug: string,
    @Body('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.create(nestSlug, user.id, targetUserId)
  }

  @Get(':inviteId')
  get(
    @Param('nestSlug') nestSlug: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.getAsNest(nestSlug, inviteId, user.id)
  }

  @Post(':inviteId/revoke')
  revoke(
    @Param('nestSlug') nestSlug: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invites.revoke(nestSlug, inviteId, user.id)
  }
}