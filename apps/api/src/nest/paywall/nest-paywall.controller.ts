import { Body, Controller, Delete, Get, Param, Put, UseInterceptors } from '@nestjs/common'
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
import { NestPaywallResponseDto } from './dto/nest-paywall-response.dto'
import { NestPaywallSetPriceDto } from './dto/nest-paywall.set-price.dto'
import { NestPaywallService } from './nest-paywall.service'

/** View and configure a nest's paywall (price, on/off). */
@ApiTags('Nest Paywall')
@Controller('nests/:nestSlug/paywall')
@UseInterceptors(ResponseInterceptor)
export class NestPaywallController {
  constructor(
    private readonly paywall: NestPaywallService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestPaywallGet', summary: 'Get a nest\'s paywall configuration' })
  @ApiDataResponse({ status: 200, description: 'Paywall configuration', type: NestPaywallResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  get(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.paywall.get(nestSlug, user.id)
  }

  @Put()
  @ApiOperation({ operationId: 'nestPaywallSetPrice', summary: 'Enable the paywall and set its price' })
  @ApiDataResponse({ status: 200, description: 'Paywall price set', type: NestPaywallResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(ValidationException, NestNotFoundException, InsufficientPermissionsException)
  setPrice(
    @Param('nestSlug') nestSlug: string,
    @Body() dto: NestPaywallSetPriceDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.paywall.setPrice(nestSlug, user.id, dto)
  }

  @Delete()
  @ApiOperation({ operationId: 'nestPaywallDisable', summary: 'Disable the paywall' })
  @ApiDataResponse({ status: 200, description: 'Paywall disabled', type: NestPaywallResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  disable(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.paywall.disable(nestSlug, user.id)
  }
}
