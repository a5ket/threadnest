import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { VerifiedGuard } from 'src/security/guards/verified.guard'
import { NestInviteService } from './nest-invite.service'

@Controller('nests/:nestSlug/invites')
@UseGuards(AuthGuard)
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
  @UseGuards(VerifiedGuard)
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