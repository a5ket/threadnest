import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { NestBanService } from './nest-ban.service'

@Controller('nests/:nestSlug/bans')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class NestBanController {
  constructor(
    private readonly bans: NestBanService
  ) { }

  @Get()
  async listBans(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.bans.listBans(nestSlug, user.id)
  }

  @Post(':userId')
  async banUser(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.bans.banUser(nestSlug, user.id, targetUserId)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unbanUser(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.bans.unbanUser(nestSlug, user.id, targetUserId)
  }
}