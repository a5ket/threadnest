import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { NestBanResponseDto } from './dto/nest-ban-response.dto'
import { BanNotFoundException } from './exceptions/ban-not-found.exception'
import { CannotBanYourselfException } from './exceptions/cannot-ban-yourself.exception'
import { CannotUnbanYourselfException } from './exceptions/cannot-unban-yourself.exception'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception'
import { NestBanService } from './nest-ban.service'

/** Ban/unban a nest member and list a nest's active bans. */
@ApiTags('Nest Bans')
@Controller('nests/:nestSlug/bans')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestBanController {
  constructor(
    private readonly bans: NestBanService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestBanList', summary: 'List users banned from a nest' })
  @ApiDataResponse({ status: 200, description: 'Bans', type: NestBanResponseDto, isArray: true })
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  listBans(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.bans.listBans(nestSlug, user.id)
  }

  @Post(':userId')
  @ApiOperation({ operationId: 'nestBanCreate', summary: 'Ban a user from a nest' })
  @ApiDataResponse({ status: 201, description: 'User banned', type: NestBanResponseDto })
  @ApiExceptionResponses(
    NestNotFoundException,
    UserNotFoundException,
    CannotBanYourselfException,
    InsufficientPermissionsException,
    UserAlreadyBannedException,
  )
  banUser(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.bans.banUser(nestSlug, user.id, targetUserId)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'nestBanRevoke', summary: 'Unban a user from a nest' })
  @ApiResponse({ status: 204, description: 'User unbanned' })
  @ApiExceptionResponses(
    NestNotFoundException,
    CannotUnbanYourselfException,
    InsufficientPermissionsException,
    BanNotFoundException,
  )
  async unbanUser(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.bans.unbanUser(nestSlug, user.id, targetUserId)
  }
}
