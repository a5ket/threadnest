import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AlreadyMemberException } from 'src/nest/member/exceptions/already-member.exception'
import { UserIsBannedException } from 'src/nest/member/exceptions/user-is-banned.exception'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AlreadyHasPendingJoinRequestException } from './exceptions/already-has-pending-join-request.exception'
import { AlreadyInvitedException } from '../invite/exceptions/already-invited.exception'
import { JoinRequestNotPendingException } from './exceptions/join-request-not-pending.exception'
import { JoinRequestsNotAcceptedException } from './exceptions/join-requests-not-accepted.exception'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestPersonalResponseDto } from './dto/nest-join-request-personal-response.dto'
import { NestJoinRequestResponseDto } from './dto/nest-join-request-response.dto'
import { NestJoinRequestService } from './nest-join-request.service'

@ApiTags('Nest Join Requests')
@Controller('nests/:nestSlug/join-requests')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestJoinRequestCollectionController {
  constructor(
    private readonly joinRequest: NestJoinRequestService,
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestJoinRequestList', summary: 'List join requests for a nest' })
  @ApiDataResponse({ status: 200, description: 'Join requests', type: NestJoinRequestResponseDto, isArray: true })
  @ApiExceptionResponses(InsufficientPermissionsException)
  list(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.listAsNest(nestSlug, user.id)
  }

  @Post()
  @ApiOperation({ operationId: 'nestJoinRequestCreate', summary: 'Request to join a nest' })
  @ApiDataResponse({ status: 201, description: 'Join request created', type: NestJoinRequestPersonalResponseDto })
  @ApiExceptionResponses(
    JoinRequestsNotAcceptedException,
    AlreadyMemberException,
    UserIsBannedException,
    AlreadyHasPendingJoinRequestException,
    AlreadyInvitedException,
  )
  create(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.create(nestSlug, user.id)
  }

  @Get(':requestId')
  @ApiOperation({ operationId: 'nestJoinRequestGet', summary: 'Get a join request for a nest' })
  @ApiDataResponse({ status: 200, description: 'Join request', type: NestJoinRequestResponseDto })
  @ApiExceptionResponses(InsufficientPermissionsException, NestJoinRequestNotFoundException)
  get(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequest.getAsNest(nestSlug, requestId, user.id)
  }

  @Post(':requestId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestJoinRequestApprove', summary: 'Approve a join request' })
  @ApiResponse({ status: 204, description: 'Join request approved' })
  @ApiExceptionResponses(InsufficientPermissionsException, NestJoinRequestNotFoundException, JoinRequestNotPendingException, AlreadyMemberException, UserIsBannedException)
  async approve(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.joinRequest.approve(nestSlug, requestId, user.id)
  }

  @Post(':requestId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestJoinRequestReject', summary: 'Reject a join request' })
  @ApiResponse({ status: 204, description: 'Join request rejected' })
  @ApiExceptionResponses(InsufficientPermissionsException, NestJoinRequestNotFoundException, JoinRequestNotPendingException)
  async reject(
    @Param('nestSlug') nestSlug: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.joinRequest.reject(nestSlug, requestId, user.id)
  }
}
