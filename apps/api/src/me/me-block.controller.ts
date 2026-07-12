import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { BlockService } from 'src/block/block.service'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

@Controller('me/blocks')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeBlockController {
  constructor(
    private readonly blocks: BlockService
  ) { }

  @Get()
  async listBlocks(
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.listBlockedUsers(user.id)
  }

  @Post(':blockedId')
  async blockUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.blockUser(user.id, blockedId)
  }

  @Delete(':blockedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.blocks.unblockUser(user.id, blockedId)
  }

  @Get(':blockedId')
  async getBlockedUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.getBlockedUser(user.id, blockedId)
  }
}