import { Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { NestJoinRequestService } from './nest-join-request.service'

@Controller('nests/:nestSlug/join-requests')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class NestJoinRequestCollectionController {
  constructor(
    private readonly joinRequest: NestJoinRequestService,
  ) { }

  @Get()
  list(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.listAsNest(nestSlug, user.id)
  }

  @Post()
  create(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.create(nestSlug, user.id)
  }

  @Get(':requestId')
  get(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.getAsNest(nestSlug, requestId, user.id)
  }

  @Post(':requestId/approve')
  approve(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.approve(nestSlug, requestId, user.id)
  }

  @Post(':requestId/reject')
  reject(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.reject(nestSlug, requestId, user.id)
  }
}