import { Controller, Delete, Get, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import type { AuthUser } from 'src/common/types/auth.user'
import { AuthenticatedAndVerified } from 'src/security/decorators/authenticated-and-verified.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { NestNotFoundException } from '../exceptions/nest-not-found.exception'
import { NestSubscriptionResponseDto } from './dto/nest-subscription-response.dto'
import { AlreadySubscribedException } from './exceptions/already-subscribed.exception'
import { NestNotPaywalledException } from './exceptions/nest-not-paywalled.exception'
import { NoActiveSubscriptionException } from './exceptions/no-active-subscription.exception'
import { NestSubscriptionService } from './nest-subscription.service'

class NestSubscriptionCheckoutResponseDto {
  @ApiProperty({ description: 'Stripe Embedded Checkout client secret' })
  clientSecret!: string
}

@ApiTags('Nest Subscriptions')
@Controller('nests/:nestSlug/subscription')
@UseInterceptors(ResponseInterceptor)
export class NestSubscriptionController {
  constructor(
    private readonly subscriptions: NestSubscriptionService
  ) { }

  @Get()
  @ApiOperation({ operationId: 'nestSubscriptionGet', summary: 'Get the current user\'s subscription to a nest, if any' })
  @ApiDataResponse({ status: 200, description: 'Current subscription, or null if none', type: NestSubscriptionResponseDto, nullable: true })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException)
  get(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.subscriptions.getForActor(nestSlug, user.id)
  }

  @Post('checkout')
  @ApiOperation({ operationId: 'nestSubscriptionCheckout', summary: 'Start a Stripe Checkout session to subscribe to a paywalled nest' })
  @ApiDataResponse({ status: 201, description: 'Checkout session created', type: NestSubscriptionCheckoutResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, NestNotPaywalledException, AlreadySubscribedException, InsufficientPermissionsException)
  checkout(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.subscriptions.createCheckoutSession(nestSlug, user.id, user.email)
  }

  @Delete()
  @ApiOperation({ operationId: 'nestSubscriptionCancel', summary: 'Cancel the current user\'s subscription to a nest' })
  @ApiDataResponse({ status: 200, description: 'Subscription canceled', type: NestSubscriptionResponseDto })
  @AuthenticatedAndVerified()
  @ApiExceptionResponses(NestNotFoundException, NoActiveSubscriptionException)
  cancel(
    @Param('nestSlug') nestSlug: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.subscriptions.cancel(nestSlug, user.id)
  }
}
