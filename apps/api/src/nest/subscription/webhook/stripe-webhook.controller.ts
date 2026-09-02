import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import type { Request } from 'express'
import { StripeWebhookService } from './stripe-webhook.service'

/** Stripe-only callback target — never called by API consumers, so it stays out of the public Swagger surface. */
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly webhooks: StripeWebhookService
  ) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string
  ) {
    if (!request.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe signature')
    }

    await this.webhooks.handle(request.rawBody, signature)
  }
}
