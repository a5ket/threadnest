import { Controller, Delete, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

@Controller('/me/nests')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeNestController {
  constructor(
    private readonly nestMembers: NestMemberService
  ) { }

  @Get()
  async listUserNests(
    @CurrentUser() user: AuthUser
  ) {
    return this.nestMembers.listAsUser(user.id)
  }

  @Delete(':nestSlug')
  async leaveNest(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.nestMembers.leaveNest(nestSlug, user.id)
  }
}