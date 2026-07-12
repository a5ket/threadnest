import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestJoinRequestService } from 'src/nest/join-request/nest-join-request.service'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

@Controller('/me/nest-join-requests')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeNestJoinRequestController {
  constructor(
    private readonly joinRequest: NestJoinRequestService
  ) { }

  @Get()
  list(
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.listAsUser(user.id)
  }

  @Get(':requestId')
  get(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.getAsUser(requestId, user.id)
  }

  @Post(':requestId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.cancel(requestId, user.id)
  }
}