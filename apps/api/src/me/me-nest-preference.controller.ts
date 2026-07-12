import { Body, Controller, Get, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { UserNestPreferenceUpdateDto } from 'src/nest/preferences/dto/user-nest-preference.update.dto'
import { UserNestPreferenceService } from 'src/nest/preferences/user-nest-preference.service'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'

@Controller('/me/nests/:nestSlug/preferences')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MeNestPreferenceController {
  constructor(
    private readonly preferences: UserNestPreferenceService
  ) { }

  @Get()
  get(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.preferences.get(user.id, nestSlug)
  }

  @Patch()
  update(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UserNestPreferenceUpdateDto
  ) {
    return this.preferences.update(user.id, nestSlug, dto)
  }
}