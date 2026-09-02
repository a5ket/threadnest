import { Body, Controller, Get, Param, Patch, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import type { AuthUser } from 'src/common/types/auth.user'
import { NestNotFoundException } from 'src/nest/exceptions/nest-not-found.exception'
import { UserNestPreferenceResponseDto } from 'src/nest/preferences/dto/user-nest-preference-response.dto'
import { UserNestPreferenceUpdateDto } from 'src/nest/preferences/dto/user-nest-preference.update.dto'
import { UserNestPreferenceService } from 'src/nest/preferences/user-nest-preference.service'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'

/** The signed-in user's per-nest preferences: whether they've muted it, and who can invite them to it. */
@ApiTags('Me')
@Controller('/me/nests/:nestSlug/preferences')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeNestPreferenceController {
  constructor(
    private readonly preferences: UserNestPreferenceService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'meNestPreferenceGet', summary: 'Get the current user\'s preferences for a nest' })
  @ApiDataResponse({ status: 200, description: 'Preferences', type: UserNestPreferenceResponseDto })
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  get(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.preferences.get(user.id, nestSlug)
  }

  @Patch()
  @ApiOperation({ operationId: 'meNestPreferenceUpdate', summary: 'Update the current user\'s preferences for a nest' })
  @ApiDataResponse({ status: 200, description: 'Updated preferences', type: UserNestPreferenceResponseDto })
  @ApiExceptionResponses(ValidationException, NestNotFoundException, InsufficientPermissionsException)
  update(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UserNestPreferenceUpdateDto
  ) {
    return this.preferences.update(user.id, nestSlug, dto)
  }
}
