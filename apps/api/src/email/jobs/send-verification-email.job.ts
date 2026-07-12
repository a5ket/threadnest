import { AuthEmailJob } from './auth-email.job'

export class SendVerificationEmailJob extends AuthEmailJob {
  constructor(readonly props: { to: string; token: string }) {
    super()
  }
}
