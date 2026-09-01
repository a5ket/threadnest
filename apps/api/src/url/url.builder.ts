import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UrlConfig } from './url.config'

@Injectable()
export class UrlBuilder {
  constructor(private readonly config: ConfigService<UrlConfig>) { }

  private base() {
    return this.config.getOrThrow('webAppUrl', { infer: true })
  }

  verifyEmail(token: string) {
    return `${this.base()}/verify-email?token=${token}`
  }

  resetPassword(token: string) {
    return `${this.base()}/reset-password?token=${token}`
  }

  changeEmail(token: string) {
    return `${this.base()}/change-email?token=${token}`
  }

  nestCheckoutReturn(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/subscribe?checkout=complete`
  }

  nestPayoutOnboardingReturn(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/settings?payout=onboarded`
  }

  nestPayoutOnboardingRefresh(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/settings?payout=refresh`
  }
}
