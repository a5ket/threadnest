import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { BlockService } from 'src/block/block.service'
import { AlreadyBlockedException } from 'src/block/exceptions/already-blocked.exception'
import { CannotBlockYourselfException } from 'src/block/exceptions/cannot-block-yourself.exception'
import { NotBlockedException } from 'src/block/exceptions/not-blocked.exception'
import { BlockedUserResponseDto } from 'src/block/dto/blocked-user-response.dto'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'

/** The current user's outgoing blocks: list, create, check, remove. */
@ApiTags('Blocks')
@Controller('me/blocks')
@UseInterceptors(ResponseInterceptor)
export class MeBlockController {
  constructor(
    private readonly blocks: BlockService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meBlockList', summary: 'List blocked users' })
  @ApiDataResponse({ status: 200, description: 'Blocked users', type: BlockedUserResponseDto, isArray: true })
  @Authenticated()
  async listBlocks(
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.listBlockedUsers(user.id)
  }

  @Post(':blockedId')
  @ApiOperation({ operationId: 'meBlockCreate', summary: 'Block a user' })
  @ApiDataResponse({ status: 201, description: 'User blocked', type: BlockedUserResponseDto })
  @Authenticated()
  @ApiExceptionResponses(CannotBlockYourselfException, UserNotFoundException, AlreadyBlockedException)
  async blockUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.blockUser(user.id, blockedId)
  }

  @Delete(':blockedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'meBlockDelete', summary: 'Unblock a user' })
  @Authenticated()
  @ApiExceptionResponses(NotBlockedException)
  async unblockUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.blocks.unblockUser(user.id, blockedId)
  }

  @Get(':blockedId')
  @ApiOperation({ operationId: 'meBlockGet', summary: 'Check whether a user is blocked' })
  @ApiDataResponse({ status: 200, description: 'Block', type: BlockedUserResponseDto })
  @Authenticated()
  @ApiExceptionResponses(NotBlockedException)
  async getBlockedUser(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.blocks.getBlockedUser(user.id, blockedId)
  }
}
