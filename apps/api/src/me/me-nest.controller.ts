import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestSummaryResponseDto } from 'src/nest/dto/nest-summary-response.dto'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { OwnerCannotLeaveException } from 'src/nest/member/exceptions/owner-cannot-leave.exception'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'

/** The signed-in user's nest memberships: list mine, leave one. */
@ApiTags('Me')
@Controller('/me/nests')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeNestController {
  constructor(
    private readonly nestMembers: NestMemberService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meNestList', summary: 'List nests the current user is a member of' })
  @ApiDataResponse({ status: 200, description: 'Nests', type: NestSummaryResponseDto, isArray: true })
  async listUserNests(
    @CurrentUser() user: AuthUser
  ) {
    return this.nestMembers.listNestsByUser(user.id)
  }

  @Delete(':nestSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meNestLeave', summary: 'Leave a nest' })
  @ApiResponse({ status: 204, description: 'Left the nest' })
  @ApiExceptionResponses(NestNotFoundException, OwnerCannotLeaveException, InsufficientPermissionsException)
  async leaveNest(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.nestMembers.leaveNest(nestSlug, user.id)
  }
}
