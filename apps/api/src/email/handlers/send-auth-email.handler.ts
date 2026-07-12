import { Injectable } from '@nestjs/common'
import React from 'react'
import { render } from 'react-email'
import { JobHandler } from 'src/queue/job.handler'
import { UrlBuilder } from 'src/url/url.builder'
import { AuthEmailJob } from '../jobs/auth-email.job'
import { SendEmailChangeEmailJob } from '../jobs/send-email-change-email.job'
import { SendPasswordResetEmailJob } from '../jobs/send-password-reset-email.job'
import { SendVerificationEmailJob } from '../jobs/send-verification-email.job'
import { MailerService } from '../mailer.service'
import { ChangeEmailTemplate } from '../templates/change-email.template'
import { ResetPasswordTemplate } from '../templates/reset-password.template'
import { VerifyEmailTemplate } from '../templates/verify-email.template'

@Injectable()
export class SendAuthEmailHandler extends JobHandler<AuthEmailJob> {
  readonly jobClass = AuthEmailJob as unknown as new (...args: any[]) => AuthEmailJob

  constructor(
    private readonly mailer: MailerService,
    private readonly url: UrlBuilder
  ) {
    super()
  }

  async handle(job: AuthEmailJob) {
    const { subject, html } = await this.renderJob(job)
    await this.mailer.send(job.props.to, subject, html)
  }

  private async renderJob(job: AuthEmailJob): Promise<{ subject: string; html: string }> {
    if (job instanceof SendVerificationEmailJob) {
      return {
        subject: 'Verify your email',
        html: await render(React.createElement(VerifyEmailTemplate, { verifyUrl: this.url.verifyEmail(job.props.token) }))
      }
    }

    if (job instanceof SendPasswordResetEmailJob) {
      return {
        subject: 'Reset your password',
        html: await render(React.createElement(ResetPasswordTemplate, { resetUrl: this.url.resetPassword(job.props.token) }))
      }
    }

    if (job instanceof SendEmailChangeEmailJob) {
      return {
        subject: 'Confirm your new email',
        html: await render(React.createElement(ChangeEmailTemplate, { changeEmailUrl: this.url.changeEmail(job.props.token), newEmail: job.props.newEmail }))
      }
    }

    throw new Error(`Unhandled auth email job type: ${job.type}`)
  }
}
