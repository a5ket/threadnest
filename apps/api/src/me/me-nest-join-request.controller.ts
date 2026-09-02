import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JoinRequestNotPendingException } from 'src/nest/join-request/exceptions/join-request-not-pending.exception'
import { NestJoinRequestNotFoundException } from 'src/nest/join-request/exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestPersonalResponseDto } from 'src/nest/join-request/dto/nest-join-request-personal-response.dto'
import { NestJoinRequestService } from 'src/nest/join-request/nest-join-request.service'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'

/** The requester's side of join requests: list mine, view one, cancel. */
@ApiTags('Nest Join Requests')
@Controller('/me/nest-join-requests')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeNestJoinRequestController {
  constructor(
    private readonly joinRequest: NestJoinRequestService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meNestJoinRequestList', summary: 'List the current user\'s join requests' })
  @ApiDataResponse({ status: 200, description: 'Join requests', type: NestJoinRequestPersonalResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.listAsUser(user.id)
  }

  @Get(':requestId')
  @ApiOperation({ operationId: 'meNestJoinRequestGet', summary: 'Get one of the current user\'s join requests' })
  @ApiDataResponse({ status: 200, description: 'Join request', type: NestJoinRequestPersonalResponseDto })
  @ApiExceptionResponses(NestJoinRequestNotFoundException)
  get(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.getAsUser(requestId, user.id)
  }

  @Post(':requestId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNestJoinRequestCancel', summary: 'Cancel a pending join request' })
  @ApiResponse({ status: 204, description: 'Join request cancelled' })
  @ApiExceptionResponses(NestJoinRequestNotFoundException, JoinRequestNotPendingException)
  cancel(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.joinRequest.cancel(requestId, user.id)
  }
}
