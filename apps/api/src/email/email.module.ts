import { Module } from '@nestjs/common'
import { QueueModule } from 'src/queue/queue.module'
import { UrlModule } from 'src/url/url.module'
import { EmailService } from './email.service'
import { SendAuthEmailHandler } from './handlers/send-auth-email.handler'
import { MailerService } from './mailer.service'

@Module({
  imports: [QueueModule.forFeature('email'), UrlModule],
  providers: [EmailService, MailerService, SendAuthEmailHandler],
  exports: [EmailService]
})
export class EmailModule { }
