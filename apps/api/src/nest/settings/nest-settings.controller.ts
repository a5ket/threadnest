import { Body, Controller, Get, Param, Patch, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { NestNotFoundException } from '../exceptions/nest-not-found.exception'
import { NestSettingsResponseDto } from './dto/nest-settings-response.dto'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'
import { NestSettingsNotFoundException } from './exceptions/nest-settings-not-found.exception'
import { NestSettingsService } from './nest-settings.service'

/** View and update a nest's visibility, join policy, and permission-level thresholds. */
@ApiTags('Nest Settings')
@Controller('nests/:nestSlug/settings')
@UseInterceptors(ResponseInterceptor)
export class NestSettingsController {
  constructor(
    private readonly settings: NestSettingsService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestSettingsGet', summary: 'Get a nest\'s settings' })
  @ApiDataResponse({ status: 200, description: 'Nest settings', type: NestSettingsResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, NestSettingsNotFoundException, InsufficientPermissionsException)
  async getNestSettings(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.settings.getSettings(nestSlug, user.id)
  }

  @Patch()
  @ApiOperation({ operationId: 'nestSettingsUpdate', summary: 'Update a nest\'s settings' })
  @ApiDataResponse({ status: 200, description: 'Nest settings updated', type: NestSettingsResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, NestSettingsNotFoundException, InsufficientPermissionsException)
  async updateNestSettings(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestSettingsUpdateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.settings.updateSettings(nestSlug, user.id, dto)
  }
}
