import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestInviteService } from 'src/nest/invite/nest-invite.service'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

@Controller('/me/nest-invites')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeNestInviteController {
  constructor(
    private readonly invites: NestInviteService
  ) { }

  @Get()
  list(
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.listAsUser(user.id)
  }

  @Get(':inviteId')
  get(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.getAsUser(inviteId, user.id)
  }

  @Post(':inviteId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  accept(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.accept(inviteId, user.id)
  }

  @Post(':inviteId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  decline(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.invites.decline(inviteId, user.id)
  }
}