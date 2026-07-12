import { Body, Controller, Get, Param, Patch, UseGuards, UseInterceptors } from '@nestjs/common'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import type { AuthUser } from 'src/common/types/auth.user'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { AuthGuard } from 'src/security/guards/auth.guard'
import { NestSettingsService } from './nest-settings.service'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'

@Controller('nests/:nestSlug/settings')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class NestSettingsController {
  constructor(
    private readonly settings: NestSettingsService
  ) { }

  @Get()
  async getNestSettings(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.settings.getSettings(nestSlug, user.id)
  }

  @Patch()
  async updateNestSettings(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestSettingsUpdateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.settings.updateSettings(nestSlug, user.id, dto)
  }
}