import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { EmailConfig } from './email.config'

/** Thin wrapper around a Nodemailer SMTP transport for sending raw emails. */
@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter
  private readonly from: string

  constructor(private readonly config: ConfigService<EmailConfig>) {
    this.from = this.config.getOrThrow('emailFrom', { infer: true })
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow('smtpHost', { infer: true }),
      port: this.config.getOrThrow('smtpPort', { infer: true }),
      auth: {
        user: this.config.getOrThrow('smtpUser', { infer: true }),
        pass: this.config.getOrThrow('smtpPass', { infer: true })
      }
    })
  }

  /**
   * @param to - The recipient address.
   * @param subject - The email subject line.
   * @param html - The email body, as HTML.
   */
  async send(to: string, subject: string, html: string) {
    await this.transporter.sendMail({ from: this.from, to, subject, html })
  }
}
