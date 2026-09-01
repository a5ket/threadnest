import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { StripeService } from 'src/billing/stripe.service'
import { NestRepository } from '../nest.repository'
import { NestPaywallSetPriceDto } from './dto/nest-paywall.set-price.dto'
import { NestPaywallPolicy } from './nest-paywall.policy'
import { NestPaywallRepository } from './nest-paywall.repository'

export interface NestPaywallView {
  isPaywalled: boolean
  priceAmountCents: number | null
}

@Injectable()
export class NestPaywallService {
  constructor(
    private readonly paywallPolicy: NestPaywallPolicy,
    private readonly paywallRepo: NestPaywallRepository,
    private readonly nestsRepo: NestRepository,
    private readonly stripe: StripeService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestPaywallService.name)
  }

  async get(nestSlug: string, actorUserId: string): Promise<NestPaywallView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.paywallPolicy.assertCanManage(nest.id, actorUserId)

    return this.toView(await this.paywallRepo.get(nest.id))
  }

  async setPrice(nestSlug: string, actorUserId: string, dto: NestPaywallSetPriceDto): Promise<NestPaywallView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.paywallPolicy.assertCanManage(nest.id, actorUserId)

    const stripePriceId = await this.stripe.createPrice(nest.name, dto.amountCents)

    const paywall = await this.paywallRepo.upsert(nest.id, {
      isPaywalled: true,
      stripePriceId,
      priceAmountCents: dto.amountCents
    })

    this.logger.info({ nestId: nest.id, actorUserId, amountCents: dto.amountCents }, 'Nest paywall price set')

    return this.toView(paywall)
  }

  async disable(nestSlug: string, actorUserId: string): Promise<NestPaywallView> {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.paywallPolicy.assertCanManage(nest.id, actorUserId)

    const paywall = await this.paywallRepo.upsert(nest.id, { isPaywalled: false })

    this.logger.info({ nestId: nest.id, actorUserId }, 'Nest paywall disabled')

    return this.toView(paywall)
  }

  private toView(paywall: { isPaywalled: boolean, priceAmountCents: number | null } | null): NestPaywallView {
    return {
      isPaywalled: paywall?.isPaywalled ?? false,
      priceAmountCents: paywall?.priceAmountCents ?? null
    }
  }
}
