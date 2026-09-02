import { Body, Controller, Get, Patch, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { UserPreferenceResponseDto } from 'src/user/preferences/dto/user-preference-response.dto'
import { UserPreferenceUpdateDto } from 'src/user/preferences/dto/user-preference.update.dto'
import { UserPreferenceService } from 'src/user/preferences/user-preference.service'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'

/** The signed-in user's account-wide privacy preferences. */
@ApiTags('Me')
@Controller('/me/preferences')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MePreferenceController {
  constructor(
    private readonly preferences: UserPreferenceService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'mePreferenceGet', summary: 'Get the current user\'s preferences' })
  @ApiDataResponse({ status: 200, description: 'Preferences', type: UserPreferenceResponseDto })
  get(@CurrentUser() user: AuthUser) {
    return this.preferences.get(user.id)
  }

  @Patch()
  @ApiOperation({ operationId: 'mePreferenceUpdate', summary: 'Update the current user\'s preferences' })
  @ApiDataResponse({ status: 200, description: 'Updated preferences', type: UserPreferenceResponseDto })
  @ApiExceptionResponses(ValidationException)
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UserPreferenceUpdateDto
  ) {
    return this.preferences.update(user.id, dto)
  }
}
