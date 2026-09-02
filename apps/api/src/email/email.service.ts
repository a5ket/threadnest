import { Injectable } from '@nestjs/common'
import { QueueService } from 'src/queue/queue.service'
import { SendEmailChangeEmailJob } from './jobs/send-email-change-email.job'
import { SendPasswordResetEmailJob } from './jobs/send-password-reset-email.job'
import { SendVerificationEmailJob } from './jobs/send-verification-email.job'

/** Queues transactional auth emails — actual sending happens asynchronously via the job queue. */
@Injectable()
export class EmailService {
    constructor(private readonly queue: QueueService) { }

    /**
     * @param to - The recipient address.
     * @param token - The email-verification token to embed in the link.
     */
    async sendVerificationEmail(to: string, token: string) {
        await this.queue.enqueue(new SendVerificationEmailJob({ to, token }))
    }

    /**
     * @param to - The recipient address.
     * @param token - The password-reset token to embed in the link.
     */
    async sendPasswordResetEmail(to: string, token: string) {
        await this.queue.enqueue(new SendPasswordResetEmailJob({ to, token }))
    }

    /**
     * Sent to the new address itself, to confirm the account holder actually controls it before
     * the change takes effect.
     *
     * @param to - The recipient address — the *new* email being changed to.
     * @param token - The email-change confirmation token to embed in the link.
     * @param newEmail - The address being changed to, shown in the email body.
     */
    async sendEmailChangeEmail(to: string, token: string, newEmail: string) {
        await this.queue.enqueue(new SendEmailChangeEmailJob({ to, token, newEmail }))
    }
}
