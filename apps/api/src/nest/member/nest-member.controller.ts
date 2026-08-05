import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { Verified } from 'src/security/decorators/verified.decorator'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { NestMemberUpdateRoleDto } from './dto/nest-member.update-role.dto'
import { NestMemberService } from './nest-member.service'

@Controller('nests/:nestSlug/members')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class NestMemberController {
  constructor(
    private readonly nestMember: NestMemberService,
  ) { }

  @Get()
  list(
    @Param('nestSlug') nestSlug: string,
    @Query() query: NestMemberQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.nestMember.listMembers(nestSlug, user.id, query)
  }

  @Delete(':userId')
  @Verified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.nestMember.removeMember(nestSlug, user.id, targetUserId)
  }

  @Patch(':userId/role')
  @Verified()
  async changeMemberRole(
    @Param('nestSlug') nestSlug: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: NestMemberUpdateRoleDto,
  ) {
    return this.nestMember.changeRole(nestSlug, user.id, targetUserId, dto)
  }

}