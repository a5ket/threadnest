import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UrlConfig } from './url.config'

/** Builds frontend (web app) URLs — for links embedded in emails and Stripe redirect targets. */
@Injectable()
export class UrlBuilder {
  constructor(private readonly config: ConfigService<UrlConfig>) { }

  private base() {
    return this.config.getOrThrow('webAppUrl', { infer: true })
  }

  /** @param token - The email-verification token to embed. */
  verifyEmail(token: string) {
    return `${this.base()}/verify-email?token=${token}`
  }

  /** @param token - The password-reset token to embed. */
  resetPassword(token: string) {
    return `${this.base()}/reset-password?token=${token}`
  }

  /** @param token - The email-change confirmation token to embed. */
  changeEmail(token: string) {
    return `${this.base()}/change-email?token=${token}`
  }

  /** @param nestSlug - The nest whose paywall checkout just completed. */
  nestCheckoutReturn(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/subscribe?checkout=complete`
  }

  /** @param nestSlug - The nest whose Stripe Connect onboarding just completed. */
  nestPayoutOnboardingReturn(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/settings?payout=onboarded`
  }

  /**
   * @param nestSlug - The nest whose Stripe Connect onboarding link expired and needs a fresh one.
   */
  nestPayoutOnboardingRefresh(nestSlug: string) {
    return `${this.base()}/n/${nestSlug}/settings?payout=refresh`
  }
}
