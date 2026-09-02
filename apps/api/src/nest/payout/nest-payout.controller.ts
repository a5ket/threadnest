import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { NestNotFoundException } from '../exceptions/nest-not-found.exception'
import { NestPayoutAccountResponseDto } from './dto/nest-payout-account-response.dto'
import { NestPayoutOnboardingResponseDto } from './dto/nest-payout-onboarding-response.dto'
import { NothingToWithdrawException } from './exceptions/nothing-to-withdraw.exception'
import { PayoutAccountNotConnectedException } from './exceptions/payout-account-not-connected.exception'
import { PayoutsNotEnabledException } from './exceptions/payouts-not-enabled.exception'
import { NestPayoutService } from './nest-payout.service'

/** Stripe Connect onboarding and balance withdrawal for a nest's paywall earnings. */
@ApiTags('Nest Payouts')
@Controller('nests/:nestSlug/payout')
@UseInterceptors(ResponseInterceptor)
export class NestPayoutController {
  constructor(
    private readonly payout: NestPayoutService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestPayoutGet', summary: 'Get this nest\'s connected payout account status and withdrawable balance' })
  @ApiDataResponse({ status: 200, description: 'Payout account status', type: NestPayoutAccountResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  get(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.payout.get(nestSlug, user.id)
  }

  @Post('onboarding')
  @ApiOperation({ operationId: 'nestPayoutStartOnboarding', summary: 'Start or continue Stripe Connect onboarding for this nest\'s payout account' })
  @ApiDataResponse({ status: 201, description: 'Onboarding link created', type: NestPayoutOnboardingResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException)
  startOnboarding(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.payout.startOnboarding(nestSlug, user.id, user.email)
  }

  @Post('withdraw')
  @ApiOperation({ operationId: 'nestPayoutWithdraw', summary: 'Withdraw this nest\'s current balance to its connected payout account' })
  @ApiDataResponse({ status: 201, description: 'Withdrawal transferred', type: NestPayoutAccountResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, InsufficientPermissionsException, PayoutAccountNotConnectedException, PayoutsNotEnabledException, NothingToWithdrawException)
  withdraw(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.payout.withdraw(nestSlug, user.id)
  }
}
