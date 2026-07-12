import { Injectable } from '@nestjs/common'
import { QueueService } from 'src/queue/queue.service'
import { SendEmailChangeEmailJob } from './jobs/send-email-change-email.job'
import { SendPasswordResetEmailJob } from './jobs/send-password-reset-email.job'
import { SendVerificationEmailJob } from './jobs/send-verification-email.job'

@Injectable()
export class EmailService {
    constructor(private readonly queue: QueueService) { }

    async sendVerificationEmail(to: string, token: string) {
        await this.queue.enqueue(new SendVerificationEmailJob({ to, token }))
    }

    async sendPasswordResetEmail(to: string, token: string) {
        await this.queue.enqueue(new SendPasswordResetEmailJob({ to, token }))
    }

    async sendEmailChangeEmail(to: string, token: string, newEmail: string) {
        await this.queue.enqueue(new SendEmailChangeEmailJob({ to, token, newEmail }))
    }
}
